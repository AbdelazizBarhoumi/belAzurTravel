<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * AdminHotelController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload (multipart) or as a string path.
 * - Gallery: send `gallery` as an array of existing image paths
 *   and/or `gallery_files` as an array of uploaded image files.
 * - Backend will store uploaded files under `storage/app/public/uploads` and
 *   persist paths prefixed with `/storage/` in details.gallery.
 */
class AdminHotelController extends Controller
{
    use \App\Concerns\HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.hotels', now()->addMinutes(5), function () {
            return Hotel::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Hotel::create($this->attributes($request));
        $this->flushAdminCache('hotels', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Hotel::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Hotel::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('hotels', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Hotel::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('hotels', $identifier);
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['amenities', 'rooms', 'gallery']);

        $rules = [
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'name_fr' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'name_ar' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_en' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'location_fr' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'location_ar' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'category_fr' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'category_ar' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'whatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'stars' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:5'],
            'reviews' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'image' => $request->hasFile('image')
                ? [$existing ? 'sometimes' : 'required', 'image', 'max:10240']
                : [$existing ? 'sometimes' : 'required', 'string', 'max:2048'],
            'gallery' => ['sometimes', 'nullable'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['file', 'image', 'max:4096'],
            'amenities' => ['sometimes', 'nullable'],
            'amenities.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amenities.*.name' => ['sometimes', 'array'],
            'amenities.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amenities.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amenities.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms' => ['sometimes', 'nullable'],
            'rooms.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.name' => ['sometimes', 'array'],
            'rooms.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.description' => ['sometimes', 'array'],
            'rooms.*.description.en' => ['sometimes', 'nullable', 'string'],
            'rooms.*.description.fr' => ['sometimes', 'nullable', 'string'],
            'rooms.*.description.ar' => ['sometimes', 'nullable', 'string'],
            'rooms.*.pricePerNight' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rooms.*.capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'rooms.*.size' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rooms.*.features' => ['sometimes', 'array'],
            'rooms.*.images' => ['sometimes', 'array'],
            'destination_slug' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, array|string|null $fallback = ''): array => $this->localized($data, $key, $fallback);
        $name = $localized('name', $existing?->name);
        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'hotel') . '-' . Str::lower(Str::random(4));

        $gallery = $this->handleGallery($request, $existing?->details['gallery'] ?? []);

        return [
            'slug' => $slug,
            'code' => $existing->code ?? Str::slug($name['en'] ?? 'hotel') . '-' . Str::lower(Str::random(4)),
            'destination_slug' => $data['destination_slug'] ?? $existing->destination_slug ?? null,
            'name' => $name,
            'location' => $localized('location', $existing?->location),
            'price' => (int) ($data['price'] ?? 0),
            'rating' => (float) ($data['rating'] ?? 0),
            'stars' => (int) ($data['stars'] ?? $existing->stars ?? 0),
            'reviews' => (int) ($data['reviews'] ?? $existing->reviews ?? 0),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/hotels'),
            'amenities' => $data['amenities'] ?? $existing->amenities ?? [],
            'tags' => array_values(array_filter([Str::slug($data['category_en'] ?? $data['category'] ?? $existing?->details['category']['en'] ?? '')])),
            'details' => $this->hotelDetails($data, $existing, $gallery),
        ];
    }

    private function adminPayload(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            'slug' => $item->slug,
            'destinationSlug' => $item->destination_slug,
            'code' => $item->code,
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('location', $item->location),
            'price' => $item->price,
            'rating' => $item->rating,
            'stars' => $item->stars,
            'reviews' => $item->reviews,
            'image' => $item->image ? (str_starts_with($item->image, 'storage/') ? asset($item->image) : asset('storage/' . $item->image)) : null,
            'amenities' => $item->amenities ?? [],
            'tags' => $item->tags ?? [],
            'gallery' => $item->details['gallery'] ?? [$item->image],
            ...$this->flatLocalized('category', $item->details['category'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            ...$this->flatLocalized('city', $item->details['city'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            ...$this->flatLocalized('country', $item->details['country'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            'address' => $item->details['address'] ?? '',
            'phone' => $item->details['phone'] ?? '',
            'whatsapp' => $item->details['whatsapp'] ?? '',
            ...$this->flatLocalized('description', $item->details['description'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            'rooms' => $item->details['rooms'] ?? [],
        ];
    }

    private function localized(array $data, string $key, array|string|null $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;
        $fallbackRecord = is_array($base)
            ? ['en' => $base['en'] ?? '', 'fr' => $base['fr'] ?? '', 'ar' => $base['ar'] ?? '']
            : ['en' => (string) $base, 'fr' => (string) $base, 'ar' => (string) $base];

        return [
            'fr' => $data[$key.'_fr'] ?? $fallbackRecord['fr'] ?? '',
            'ar' => $data[$key.'_ar'] ?? $fallbackRecord['ar'] ?? '',
            'en' => $data[$key.'_en'] ?? $fallbackRecord['en'] ?? '',
        ];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function hotelDetails(array $data, ?Model $existing, array $gallery): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('category', $data) || array_key_exists('category_en', $data) || array_key_exists('category_fr', $data) || array_key_exists('category_ar', $data)) {
            $details['category'] = $this->localized($data, 'category', $existing?->details['category'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        if (array_key_exists('city', $data) || array_key_exists('city_en', $data) || array_key_exists('city_fr', $data) || array_key_exists('city_ar', $data)) {
            $details['city'] = $this->localized($data, 'city', $existing?->details['city'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        if (array_key_exists('country', $data) || array_key_exists('country_en', $data) || array_key_exists('country_fr', $data) || array_key_exists('country_ar', $data)) {
            $details['country'] = $this->localized($data, 'country', $existing?->details['country'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        if (array_key_exists('address', $data)) {
            $details['address'] = $data['address'] ?? '';
        }

        if (array_key_exists('phone', $data)) {
            $details['phone'] = $data['phone'] ?? '';
        }

        if (array_key_exists('whatsapp', $data)) {
            $details['whatsapp'] = $data['whatsapp'] ?? '';
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description', $existing?->details['description'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        $details['gallery'] = $gallery;

        if (array_key_exists('rooms', $data) && is_array($data['rooms'])) {
            $details['rooms'] = array_values(array_filter(array_map(fn (array $room): array => [
                'id' => $room['id'] ?? null,
                'name' => $room['name'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
                'description' => $room['description'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
                'pricePerNight' => (float) ($room['pricePerNight'] ?? 0),
                'capacity' => (int) ($room['capacity'] ?? 1),
                'size' => (float) ($room['size'] ?? 0),
                'features' => $room['features'] ?? [],
                'images' => $room['images'] ?? [],
            ], $data['rooms'] ?? [])));
        }

        return $details;
    }

    private function splitLines(string $value): array
    {
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }

    private function localizedValue(array|string|null $value): string
    {
        if (is_array($value)) {
            return (string) ($value['en'] ?? $value['fr'] ?? $value['ar'] ?? '');
        }
        return (string) ($value ?? '');
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
            Cache::forget("{$type}.{$identifier}"); // Public API cache key
        }
    }
}

