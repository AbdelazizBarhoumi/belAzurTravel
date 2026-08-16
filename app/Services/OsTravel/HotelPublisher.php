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
 * SSRF guard, and wires the staging row to the published hotel. In `lazy`
 * mode the provider images are not downloaded; the main image and gallery
 * are stored as opaque proxy URLs served through `HotelImageController`, so
 * a bulk approval can go live with pure database work. A later eager pass
 * (single approve or `refreshDetail`) upgrades those to local files.
 */
class HotelPublisher
{
    public function __construct(private readonly OsTravelClient $client) {}

    /**
     * Publish a staged hotel. `$overrides` may carry `base_price`,
     * `markup_percentage` and `currency`; `base_price` is required (either
     * already staged or passed in) and is persisted back to the staging row.
     *
     * @param  array{base_price?: int|float|string, markup_percentage?: int|float|string, currency?: string}  $overrides
     */
    public function publish(OsTravelHotel $staged, array $overrides = [], ?User $actor = null, bool $lazy = false): Hotel
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

        $name = $this->localized(self::cleanText($list['Name'] ?? $detail['Name'] ?? ''));
        $city = $this->localized(self::cleanText($list['City']['Name'] ?? $detail['City']['Name'] ?? ''));
        $country = $this->localized(self::cleanText($this->countryName($list, $detail)));
        $categoryTitle = self::cleanText($list['Category']['Title'] ?? $detail['Category']['Title'] ?? '');
        $stars = $list['Category']['Star'] ?? $detail['Category']['Star'] ?? 0;

        $imageUrl = $list['Image'] ?? $detail['Image'] ?? null;
        $image = $lazy
            ? $this->syncImageLazy($imageUrl, $existing?->image)
            : $this->syncImage($imageUrl, $existing?->image, $existing?->meta['image_hash'] ?? null);

        $slug = $this->resolveSlug($existing, $name['en'] ?? 'hotel', $externalId, $code);

        $meta = $existing?->meta ?? [];
        if ($imageUrl !== null && $imageUrl !== '') {
            $meta['image_hash'] = sha1($imageUrl);
        }

        $mapped = $this->mapDetails($list, $detail, $existing, $externalId, $lazy);

        $hotel = Hotel::updateOrCreate(['code' => $code], array_merge([
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
            'last_price' => $basePrice,
            'last_price_at' => now(),
            'first_available_at' => $staged->first_available_at,
            'min_nights' => $staged->min_nights,
            'stop_sale_ranges' => $staged->stop_sale_ranges ?? [],
            'source' => 'ostravel',
            'booking_mode' => 'instant',
            'rating' => (float) ($list['Rating'] ?? $detail['Rating'] ?? 0),
            'stars' => (int) $stars,
            'reviews' => (int) ($list['Reviews'] ?? $detail['Reviews'] ?? 0),
            'image' => $image,
            'tags' => $mapped['themes'],
            'details' => $mapped['details'],
            'meta' => $meta,
        ], $mapped['filter_booleans']));

        $staged->fill([
            'hotel_id' => $hotel->id,
            'status' => OsTravelHotel::APPROVED,
            'approved_by' => $actor?->id,
            'approved_at' => now(),
        ])->save();

        $this->flushAdminCache('hotels', $slug);

        return $hotel;
    }

    /**
     * Refresh a staged hotel's HotelDetail from the provider, at most once per
     * day. Safe for concurrent requests (single-flight lock); the first visitor
     * each day triggers the fetch and updates the published `hotels` row, later
     * visitors reuse the stored detail. Provider failures keep existing data
     * and leave `detail_fetched_at` untouched so the next click retries.
     */
    public function refreshDetail(OsTravelHotel $staged): void
    {
        $externalId = (string) $staged->external_id;
        $lock = Cache::lock("ostravel.detail.{$externalId}", 30);

        if (! $lock->get()) {
            return;
        }

        try {
            $staged->refresh();

            if ($staged->detail_fetched_at !== null && $staged->detail_fetched_at->isToday()) {
                return;
            }

            $detail = $this->client->hotelDetail($externalId)['HotelDetail'] ?? [];

            $staged->fill([
                'payload' => array_merge($staged->payload ?? [], ['HotelDetail' => $detail]),
                'detail_fetched_at' => now(),
            ])->save();

            if ($staged->hotel_id !== null) {
                $hotel = Hotel::query()->where('id', $staged->hotel_id)->first();

                if ($hotel !== null) {
                    $list = $staged->payload['ListHotel'] ?? [];
                    $mapped = $this->mapDetails($list, $detail, $hotel, $externalId);

                    $hotel->forceFill(array_merge([
                        'tags' => $mapped['themes'],
                        'details' => $mapped['details'],
                    ], $mapped['filter_booleans']))->save();

                    $this->flushAdminCache('hotels', $hotel->slug);
                    Cache::forget("hotels.{$hotel->slug}");
                }
            }
        } catch (Throwable $e) {
            Log::warning('OS-TRAVEL detail refresh failed; keeping existing data.', [
                'external_id' => $externalId,
                'error' => $e->getMessage(),
            ]);
        } finally {
            $lock->release();
        }
    }

    /**
     * Build the published `details`/`tags`/filter booleans shared by publish()
     * and refreshDetail() so both stay in sync.
     *
     * @param  array<string, mixed>  $list  Raw ListHotel item.
     * @param  array<string, mixed>  $detail  Raw HotelDetail item.
     * @return array{details: array<string, mixed>, themes: list<string>, filter_booleans: array<string, bool>}
     */
    protected function mapDetails(array $list, array $detail, ?Hotel $existing, string $externalId, bool $lazy = false): array
    {
        $details = $existing?->details ?? [];

        [$gallery, $gallerySources] = $this->resolveGallery(
            $detail['Album'] ?? [],
            $details['gallery_sources'] ?? null,
            $details['gallery'] ?? [],
            $lazy
        );

        $details = array_merge($details, [
            'address' => self::cleanText($detail['Adress'] ?? $list['Adress'] ?? $details['address'] ?? ''),
            'phone' => self::cleanText($detail['Phone'] ?? $details['phone'] ?? ''),
            'email' => self::cleanText($detail['Email'] ?? $details['email'] ?? ''),
            'whatsapp' => $details['whatsapp'] ?? '',
            'coordinates' => $this->coordinates($list, $detail) ?? $details['coordinates'] ?? null,
            'check_in_time' => self::cleanText($detail['CheckIn'] ?? $details['check_in_time'] ?? ''),
            'check_out_time' => self::cleanText($detail['CheckOut'] ?? $details['check_out_time'] ?? ''),
            'hotel_type' => self::cleanText($detail['Type'] ?? $details['hotel_type'] ?? ''),
            'note' => self::htmlToText($detail['Note'] ?? $list['Note'] ?? $details['note'] ?? ''),
            'options' => $this->normalizeOptions($detail['Option'] ?? $details['options'] ?? []),
            'boardings' => $this->normalizeBoardings($detail['Boarding'] ?? []),
            'facilities' => $this->normalizeFacilities($detail['Facilitie'] ?? $list['Facilities'] ?? $details['facilities'] ?? []),
            'amenity_tags' => $this->normalizeAmenityTags($detail['Tag'] ?? $details['amenity_tags'] ?? []),
            'description' => $this->localized(self::htmlToText($detail['LongDescription'] ?? '')),
            'city' => $this->localized(self::cleanText($list['City']['Name'] ?? $detail['City']['Name'] ?? '')),
            'country' => $this->localized(self::cleanText($this->countryName($list, $detail))),
            'source' => 'ostravel',
            'provider_hotel_id' => $externalId,
            'gallery' => $gallery,
            'gallery_sources' => $gallerySources,
        ]);

        $themes = $this->themes($list, $detail);

        return [
            'details' => $details,
            'themes' => $themes,
            'filter_booleans' => $this->deriveFilterBooleans($list, $detail, $themes),
        ];
    }

    /**
     * Re-download the gallery only when the provider's Album URLs changed;
     * otherwise reuse the already-downloaded local paths. In `lazy` mode the
     * provider photos are never downloaded: an existing gallery is kept, and a
     * fresh one is stored as opaque proxy URLs served through the image proxy.
     *
     * @param  list<array{Url?: string}>  $album
     * @param  list<string>|null  $existingSources
     * @param  list<string>  $existingGallery
     * @return array{0: list<string>, 1: list<string>} [stored paths, source URLs]
     */
    protected function resolveGallery(array $album, ?array $existingSources, array $existingGallery, bool $lazy = false): array
    {
        $sources = array_values(array_filter(array_map(
            fn ($item) => is_array($item) ? (string) ($item['Url'] ?? '') : '',
            $album
        )));

        if ($lazy) {
            if ($existingGallery !== [] || ($existingSources !== null && $existingSources !== [])) {
                return [$existingGallery, $existingSources ?? $sources];
            }

            $proxied = array_values(array_filter(array_map(
                static fn (string $url) => OsTravelImageProxy::publicUrl($url),
                $sources
            )));

            return [$proxied, $sources];
        }

        if ($existingSources !== null && $existingSources === $sources && $sources !== []) {
            return [$existingGallery, $sources];
        }

        return [$this->syncGallery($album), $sources];
    }

    protected function countryName(array $list, array $detail): string
    {
        $country = $list['City']['Country'] ?? $detail['City']['Country'] ?? '';

        return is_array($country) ? ($country['Name'] ?? '') : (string) $country;
    }

    /**
     * Normalize `Localization` into `{latitude, longitude}` floats, or null
     * when the provider didn't report coordinates.
     *
     * @return array{latitude: float, longitude: float}|null
     */
    protected function coordinates(array $list, array $detail): ?array
    {
        $localization = $list['Localization'] ?? $detail['Localization'] ?? null;
        if (! is_array($localization)) {
            return null;
        }

        $latitude = $localization['Latitude'] ?? null;
        $longitude = $localization['Longitude'] ?? null;

        if ($latitude === null || $longitude === null || ! is_numeric($latitude) || ! is_numeric($longitude)) {
            return null;
        }

        return ['latitude' => (float) $latitude, 'longitude' => (float) $longitude];
    }

    /**
     * @param  list<array{Id?: int, Title?: string}>  $options
     * @return list<array{id: int, title: string}>
     */
    protected function normalizeOptions(array $options): array
    {
        $normalized = [];

        foreach ($options as $option) {
            if (! is_array($option)) {
                continue;
            }

            $normalized[] = [
                'id' => (int) ($option['Id'] ?? 0),
                'title' => self::cleanText((string) ($option['Title'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * @param  list<array{Id?: int, Code?: string, Name?: string, Description?: string|null}>  $boardings
     * @return list<array{id: int, code: string, name: string, description: string}>
     */
    protected function normalizeBoardings(array $boardings): array
    {
        $normalized = [];

        foreach ($boardings as $boarding) {
            if (! is_array($boarding)) {
                continue;
            }

            $normalized[] = [
                'id' => (int) ($boarding['Id'] ?? 0),
                'code' => (string) ($boarding['Code'] ?? ''),
                'name' => self::cleanText((string) ($boarding['Name'] ?? '')),
                'description' => self::cleanText((string) ($boarding['Description'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * The provider uses `Facilitie` (singular, detail) and `Facilities`
     * (plural, list). Normalize either into `{title, category}`.
     *
     * @param  list<array{Title?: string, Category?: string}>  $facilities
     * @return list<array{title: string, category: string}>
     */
    protected function normalizeFacilities(array $facilities): array
    {
        $normalized = [];

        foreach ($facilities as $facility) {
            if (! is_array($facility)) {
                continue;
            }

            $normalized[] = [
                'title' => self::cleanText((string) ($facility['Title'] ?? '')),
                'category' => self::cleanText((string) ($facility['Category'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * Normalize the detail's `Tag[]` amenities into `{id, title, image}`,
     * resolving relative image paths against the provider base URL.
     *
     * @param  list<array{Id?: int, Title?: string, Image?: string}>  $tags
     * @return list<array{id: int, title: string, image: string}>
     */
    protected function normalizeAmenityTags(array $tags): array
    {
        $normalized = [];

        foreach ($tags as $tag) {
            if (! is_array($tag)) {
                continue;
            }

            $normalized[] = [
                'id' => (int) ($tag['Id'] ?? 0),
                'title' => self::cleanText((string) ($tag['Title'] ?? '')),
                'image' => $this->resolveProviderUrl((string) ($tag['Image'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * Resolve a provider-relative URL (e.g. `uploads/...`) against the base
     * URL, leaving absolute URLs untouched. Empty paths resolve to ''.
     */
    protected function resolveProviderUrl(string $path): string
    {
        $path = trim($path);

        if ($path === '' || preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return rtrim(config('ostravel.base_url'), '/').'/'.ltrim($path, '/');
    }

    /**
     * Resolve the hotel's theme tags, preferring ListHotel (richer) but
     * falling back to HotelDetail when the list item has none.
     *
     * @param  array<string, mixed>  $list
     * @param  array<string, mixed>  $detail
     * @return list<string>
     */
    protected function themes(array $list, array $detail): array
    {
        $themes = $this->cleanThemes($list['Theme'] ?? []);

        if ($themes !== []) {
            return $themes;
        }

        return $this->cleanThemes($detail['Theme'] ?? []);
    }

    /**
     * Normalize a provider `Theme` list: coerce values to strings, trim
     * whitespace (fixtures carry trailing spaces e.g. "Réveillon "), and drop
     * empties.
     *
     * @param  mixed  $themes  Raw provider `Theme` value.
     * @return list<string>
     */
    protected function cleanThemes(mixed $themes): array
    {
        $themes = is_array($themes) ? $themes : [];

        return array_values(array_filter(array_map(
            static fn ($theme) => trim((string) $theme),
            $themes
        )));
    }

    /**
     * Derive the existing `hotels` boolean filter columns from provider data so
     * the public filter UI works for OS-TRAVEL hotels without manual entry.
     *
     * @param  array<string, mixed>  $list  Raw ListHotel item.
     * @param  array<string, mixed>  $detail  Raw HotelDetail item.
     * @param  list<string>  $themes  Resolved theme tags.
     * @return array<string, bool>
     */
    protected function deriveFilterBooleans(array $list, array $detail, array $themes): array
    {
        $themes = array_map(fn ($theme) => trim(strtolower((string) $theme)), $themes);

        $boardingCodes = array_map(
            fn ($boarding) => strtoupper((string) ($boarding['Code'] ?? '')),
            $detail['Boarding'] ?? []
        );

        $stars = (int) ($list['Category']['Star'] ?? $detail['Category']['Star'] ?? 0);

        $themeMap = [
            // Business
            'affaires' => 'affaires',
            'business' => 'affaires',
            // Family
            'famille' => 'famille',
            'family' => 'famille',
            'voyages de noces' => 'famille',
            // Sports & leisure
            'sport' => 'sport_loisir',
            'loisirs' => 'sport_loisir',
            'sport & loisirs' => 'sport_loisir',
            'golf' => 'sport_loisir',
            // Thalasso / spa / wellness
            'thalasso' => 'thalasso_spa',
            'spa' => 'thalasso_spa',
            'thalassothérapie' => 'thalasso_spa',
            'balnéothérapie' => 'thalasso_spa',
            'thermalisme' => 'thalasso_spa',
            'bien être' => 'thalasso_spa',
            // Nature & adventure
            'nature' => 'nature_aventure',
            'aventure' => 'nature_aventure',
            'découverte' => 'nature_aventure',
            'randonnée' => 'nature_aventure',
            'montagne' => 'nature_aventure',
            'saharien' => 'nature_aventure',
            'archéologie' => 'nature_aventure',
            // Relaxation / charm / seaside / short break
            'détente' => 'detente',
            'charme' => 'detente',
            'balnéaire' => 'detente',
            'week-end' => 'detente',
            // Promotional tariffs
            'promo' => 'tarifs_promo',
        ];

        $themeFlags = [];
        foreach ($themes as $theme) {
            $target = $themeMap[$theme] ?? null;
            if ($target !== null) {
                $themeFlags[$target] = true;
            }
        }

        $boardings = [
            'logement_simple' => in_array('LS', $boardingCodes, true),
            'petit_dejeuner' => in_array('LPD', $boardingCodes, true),
            'demi_pension' => in_array('DP', $boardingCodes, true),
            'pension_complete' => in_array('PC', $boardingCodes, true),
        ];

        // Every boolean filter column gets an explicit value so the public
        // filter UI never sees nulls for provider hotels.
        return array_merge([
            'htel_recommande' => false,
            'tarifs_promo' => false,
            'enfant_gratuit' => false,
            'disponible_seulement' => false,
            'annulation_gratuite' => false,
            'logement_simple' => false,
            'petit_dejeuner' => false,
            'demi_pension' => false,
            'pension_complete' => false,
            'categorie_4_etoiles' => $stars >= 4,
            'chambre_double' => false,
            'suite' => false,
            'chambre_standard' => false,
            'suite_junior' => false,
            'thalasso_spa' => false,
            'nature_aventure' => false,
            'famille' => false,
            'affaires' => false,
            'sport_loisir' => false,
            'detente' => false,
        ], $boardings, $themeFlags);
    }

    protected function localized(string $value): array
    {
        return ['en' => $value, 'fr' => $value, 'ar' => $value];
    }

    protected function stripHtml(string $html): string
    {
        return trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    /**
     * Decode HTML entities and strip tags from a provider text field,
     * collapsing whitespace onto a single line.
     */
    public static function cleanText(string $text): string
    {
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim((string) preg_replace('/\s+/u', ' ', $text));
    }

    /**
     * Convert provider HTML (e.g. LongDescription with <p> blocks) to plain
     * text, preserving paragraph and line breaks for frontend rendering.
     */
    public static function htmlToText(string $html): string
    {
        $text = (string) preg_replace(
            ['#<\s*br\s*/?\s*>#i', '#</\s*(?:p|div|li|h[1-6])\s*>#i'],
            "\n",
            $html
        );
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = (string) preg_replace("/\n{3,}/", "\n\n", $text);

        return trim($text);
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
     * Lazy main-image resolution: never downloads. Keeps an existing stored
     * image (local or already-proxied) and otherwise stores an opaque proxy
     * URL for the provider photo, refusing to fetch private/loopback/
     * link-local hosts.
     */
    protected function syncImageLazy(?string $url, ?string $existingImage): ?string
    {
        if ($existingImage !== null && $existingImage !== '') {
            return $existingImage;
        }

        if ($url === null || $url === '') {
            return null;
        }

        if (! $this->isSafeImageUrl($url)) {
            return $url;
        }

        return OsTravelImageProxy::publicUrl($url) ?? $url;
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
