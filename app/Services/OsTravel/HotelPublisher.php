<?php

namespace App\Services\OsTravel;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Throwable;

/**
 * Turns a staged OS-TRAVEL hotel into a confirmed `hotels` row.
 *
 * Applies the configured markup to compute the public price, produces a
 * collision-safe slug, downloads and deduplicates provider images behind an
 * SSRF guard, and wires the staging row to the published hotel.
 */
class HotelPublisher
{
    /**
     * Publish a staged hotel. `$overrides` may carry `base_price`,
     * `markup_percentage` and `currency`; `base_price` is required (either
     * already staged or passed in) and is persisted back to the staging row.
     *
     * @param  array{base_price?: int|float|string, markup_percentage?: int|float|string, currency?: string}  $overrides
     */
    public function publish(OsTravelHotel $staged, array $overrides = [], ?User $actor = null): Hotel
    {
        $basePrice = $overrides['base_price'] ?? $staged->base_price;
        if ($basePrice === null || $basePrice === '') {
            throw new InvalidArgumentException('base_price is required before a staged hotel can be published.');
        }

        $basePrice = (int) $basePrice;
        $markupPercentage = (float) ($overrides['markup_percentage'] ?? $staged->markup_percentage ?? config('ostravel.markup.default', 20));
        $currency = (string) ($overrides['currency'] ?? $staged->currency ?? config('ostravel.currency.default', 'TND'));

        $staged->fill([
            'base_price' => $basePrice,
            'markup_percentage' => $markupPercentage,
            'currency' => $currency,
        ])->save();

        $list = $staged->payload['ListHotel'] ?? [];
        $detail = $staged->payload['HotelDetail'] ?? [];
        $externalId = (string) $staged->external_id;
        $code = 'ostravel-'.$externalId;

        $existing = Hotel::query()->where('code', $code)->first();

        $name = $this->localized($list['Name'] ?? $detail['Name'] ?? '');
        $city = $this->localized($list['City']['Name'] ?? $detail['City']['Name'] ?? '');
        $country = $this->localized($this->countryName($list, $detail));
        $categoryTitle = $list['Category']['Title'] ?? $detail['Category']['Title'] ?? '';
        $stars = $list['Category']['Star'] ?? $detail['Category']['Star'] ?? 0;

        $imageUrl = $list['Image'] ?? $detail['Image'] ?? null;
        $image = $this->syncImage($imageUrl, $existing?->image, $existing?->meta['image_hash'] ?? null);
        $gallery = $this->syncGallery($detail['Album'] ?? []);

        $slug = $this->resolveSlug($existing, $name['en'] ?? 'hotel', $externalId, $code);

        $details = $existing?->details ?? [];
        $details = array_merge($details, [
            'address' => $detail['Adress'] ?? $details['address'] ?? '',
            'phone' => $detail['Phone'] ?? $details['phone'] ?? '',
            'whatsapp' => $detail['Email'] ?? $details['whatsapp'] ?? '',
            'city' => $city,
            'country' => $country,
            'description' => $this->localized($this->stripHtml($detail['LongDescription'] ?? '')),
            'source' => 'ostravel',
            'provider_hotel_id' => $externalId,
            'gallery' => $gallery,
        ]);

        $meta = $existing?->meta ?? [];
        if ($imageUrl !== null && $imageUrl !== '') {
            $meta['image_hash'] = sha1($imageUrl);
        }

        $hotel = Hotel::updateOrCreate(['code' => $code], [
            'slug' => $slug,
            'code' => $code,
            'destination_slug' => $existing?->destination_slug,
            'name' => $name,
            'location' => $city,
            'category_key' => $existing?->category_key,
            'category' => $this->localized($categoryTitle),
            'price' => (int) round($basePrice * (1 + $markupPercentage / 100)),
            'base_price' => $basePrice,
            'markup_percentage' => $markupPercentage,
            'currency' => $currency,
            'rating' => (float) ($list['Rating'] ?? $detail['Rating'] ?? 0),
            'stars' => (int) $stars,
            'reviews' => (int) ($list['Reviews'] ?? $detail['Reviews'] ?? 0),
            'image' => $image,
            'tags' => array_values(array_filter($list['Theme'] ?? $detail['Theme'] ?? [])),
            'details' => $details,
            'meta' => $meta,
        ]);

        $staged->fill([
            'hotel_id' => $hotel->id,
            'status' => OsTravelHotel::PUBLISHED,
            'approved_by' => $actor?->id,
            'approved_at' => now(),
        ])->save();

        $this->flushAdminCache('hotels', $slug);

        return $hotel;
    }

    protected function countryName(array $list, array $detail): string
    {
        $country = $list['City']['Country'] ?? $detail['City']['Country'] ?? '';

        return is_array($country) ? ($country['Name'] ?? '') : (string) $country;
    }

    protected function localized(string $value): array
    {
        return ['en' => $value, 'fr' => $value, 'ar' => $value];
    }

    protected function stripHtml(string $html): string
    {
        return trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    protected function resolveSlug(?Hotel $existing, string $name, string $externalId, string $code): string
    {
        if ($existing !== null && $existing->slug !== null && $existing->slug !== '') {
            return $existing->slug;
        }

        $base = Str::slug($name) ?: 'hotel';
        $slug = $base;

        if (Hotel::query()->where('slug', $slug)->where('code', '!=', $code)->exists()) {
            $slug = $base.'-'.$externalId;
        }

        return $slug;
    }

    /**
     * Download and store the provider image when its URL hash changed. Falls
     * back to the existing local file, then to the remote URL on failure, and
     * refuses to fetch private/loopback/link-local hosts.
     */
    protected function syncImage(?string $url, ?string $existingImage, ?string $existingHash): ?string
    {
        if ($url === null || $url === '') {
            return $existingImage;
        }

        $hash = sha1($url);

        if ($hash === $existingHash && $existingImage !== null && $existingImage !== '' && str_starts_with($existingImage, '/storage/')) {
            return $existingImage;
        }

        if (! $this->isSafeImageUrl($url)) {
            Log::warning('OS-TRAVEL image URL rejected by SSRF guard; keeping existing image.', ['url' => $url]);

            return $existingImage ?: $url;
        }

        try {
            $response = Http::timeout(30)->get($url);
            if ($response->ok()) {
                $path = $this->storeImage($response->body(), $this->extensionFromUrl($url));

                return $path;
            }
        } catch (Throwable $e) {
            Log::warning('OS-TRAVEL image download failed; keeping existing image.', ['url' => $url, 'error' => $e->getMessage()]);
        }

        return $existingImage ?: $url;
    }

    /**
     * @param  list<array{Url?: string}>  $album
     * @return list<string>
     */
    protected function syncGallery(array $album): array
    {
        $downloaded = [];

        foreach ($album as $item) {
            $url = $item['Url'] ?? null;
            if ($url === null || $url === '') {
                continue;
            }

            if (! $this->isSafeImageUrl($url)) {
                Log::warning('OS-TRAVEL gallery URL rejected by SSRF guard; keeping remote URL.', ['url' => $url]);
                $downloaded[] = $url;

                continue;
            }

            try {
                $response = Http::timeout(30)->get($url);
                if ($response->ok()) {
                    $downloaded[] = $this->storeImage($response->body(), $this->extensionFromUrl($url));

                    continue;
                }
            } catch (Throwable $e) {
                Log::warning('OS-TRAVEL gallery download failed; keeping remote URL.', ['url' => $url, 'error' => $e->getMessage()]);
            }

            $downloaded[] = $url;
        }

        return array_values(array_unique($downloaded));
    }

    protected function storeImage(string $contents, string $extension): string
    {
        $folder = 'uploads/hotels';
        File::ensureDirectoryExists(storage_path("app/public/{$folder}"));
        $filename = Str::lower(Str::random(32)).'.'.$extension;
        Storage::disk('public')->put("{$folder}/{$filename}", $contents);

        return "/storage/{$folder}/{$filename}";
    }

    protected function extensionFromUrl(string $url): string
    {
        $extension = pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION);

        return in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)
            ? strtolower($extension)
            : 'jpg';
    }

    /**
     * Basic SSRF guard: scheme must be http/https and the resolved host must
     * not be a private, loopback, or link-local address.
     */
    protected function isSafeImageUrl(string $url): bool
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return false;
        }

        if (! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower($parts['host']);
        $ip = filter_var($host, FILTER_VALIDATE_IP);

        if ($ip === false) {
            $resolved = gethostbyname($host);
            if ($resolved === $host || filter_var($resolved, FILTER_VALIDATE_IP) === false) {
                return false;
            }
            $ip = $resolved;
        }

        return ! $this->isPrivateAddress($ip);
    }

    protected function isPrivateAddress(string $ip): bool
    {
        $ip = strtolower(trim($ip));

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $long = ip2long($ip);
            if ($long === false) {
                return true;
            }

            $ranges = [
                ['0.0.0.0', 8],
                ['10.0.0.0', 8],
                ['100.64.0.0', 10],
                ['127.0.0.0', 8],
                ['169.254.0.0', 16],
                ['172.16.0.0', 12],
                ['192.0.0.0', 24],
                ['192.168.0.0', 16],
                ['198.18.0.0', 15],
            ];

            foreach ($ranges as [$network, $prefix]) {
                $mask = ($prefix === 0) ? 0 : (-1 << (32 - $prefix)) & 0xFFFFFFFF;
                if (($long & $mask) === (ip2long($network) & $mask)) {
                    return true;
                }
            }

            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $ip === '::1'
                || $ip === '::'
                || str_starts_with($ip, 'fc') || str_starts_with($ip, 'fd')
                || str_starts_with($ip, 'fe8') || str_starts_with($ip, 'fe9')
                || str_starts_with($ip, 'fea') || str_starts_with($ip, 'feb');
        }

        return true;
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
            Cache::forget("{$type}.{$identifier}");
        }
    }
}
