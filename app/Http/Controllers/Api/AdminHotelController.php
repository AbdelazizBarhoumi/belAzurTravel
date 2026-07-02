<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use App\Models\Hotel;
use App\Models\HotelRoom;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.hotels', now()->addMinutes(5), function () {
            return Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities'])->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->attributes($request);
        $rooms = $data['rooms'] ?? [];
        unset($data['rooms']);
        $item = Hotel::create($data);
        $this->syncAmenities($item, $request->input('amenities', []));
        $this->syncRooms($item, $rooms);
        $this->syncCategoryAssignments($item, 'hotels', $request->input('category_assignments', []));
        $this->flushAdminCache('hotels', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities'])->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities'])->findOrFail($id);
        $data = $this->attributes($request, $item);
        $rooms = $data['rooms'] ?? [];
        unset($data['rooms']);
        $item->update($data);
        $this->syncAmenities($item, $request->input('amenities', []));
        $this->syncRooms($item, $rooms);
        $this->syncCategoryAssignments($item, 'hotels', $request->input('category_assignments', []));
        $this->flushAdminCache('hotels', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Hotel::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('hotels', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['amenities', 'gallery']);

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
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
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
            'amenities' => ['sometimes', 'array'],
            'amenities.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amenities.*.name' => ['sometimes', 'array'],
            'amenities.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amenities.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amenities.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms' => ['sometimes', 'array'],
            'rooms.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.name' => ['sometimes', 'array'],
            'rooms.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.description' => ['sometimes', 'array'],
            'rooms.*.description.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.description.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.description.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rooms.*.features' => ['sometimes', 'array'],
            'rooms.*.images' => ['sometimes', 'array'],
            'destination_slug' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, array|string|null $fallback = ''): array => $this->localized($data, $key, $fallback);
        $name = $localized('name', $existing?->name);
        $categoryKey = (string) (
            $data['category_key']
            ?? $existing?->category_key
            ?? $data['category']
            ?? ''
        );
        $category = $categoryKey !== ''
            ? Category::query()
                ->where('entity_type', 'hotels')
                ->where('key', $categoryKey)
                ->first()
            : null;
        $categoryName = $category?->name ?? $localized('category', $existing?->category ?? $existing?->details['category'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'hotel').'-'.Str::lower(Str::random(4));

        $gallery = $this->handleGallery($request, $existing?->details['gallery'] ?? [], 'uploads/hotels');

        return [
            'slug' => $slug,
            'code' => $existing->code ?? Str::slug($name['en'] ?? 'hotel').'-'.Str::lower(Str::random(4)),
            'destination_slug' => $data['destination_slug'] ?? $existing->destination_slug ?? null,
            'name' => $name,
            'location' => $localized('location', $existing?->location),
            'category_key' => $categoryKey !== '' ? $categoryKey : $existing?->category_key,
            'category' => $categoryName,
            'price' => (int) ($data['price'] ?? 0),
            'rating' => (float) ($data['rating'] ?? 0),
            'stars' => (int) ($data['stars'] ?? $existing->stars ?? 0),
            'reviews' => (int) ($data['reviews'] ?? $existing->reviews ?? 0),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/hotels'),
            'tags' => array_values(array_filter([Str::slug($categoryKey !== '' ? $categoryKey : ($data['category_en'] ?? $data['category'] ?? $existing?->details['category']['en'] ?? ''))])),
            'details' => $this->hotelDetails($request, $data, $existing, $gallery, $categoryName),
            'rooms' => $data['rooms'] ?? [],
        ];
    }

    private function adminPayload(Model $item): array
    {
        $gallery = array_map(fn ($img) => $this->normalizeApiOutputPath($img), $item->details['gallery'] ?? [$item->image]);
        $category = $item->category ?? $item->details['category'] ?? ['en' => '', 'fr' => '', 'ar' => ''];

        // Build category_assignments map from relationships
        $categoryAssignments = [];
        if ($item->relationLoaded('categoryAssignments')) {
            foreach ($item->categoryAssignments as $assignment) {
                $typeKey = $assignment->categoryType?->key;
                $valueKey = $assignment->categoryValue?->key;
                if ($typeKey && $valueKey) {
                    $categoryAssignments[$typeKey] = $valueKey;
                }
            }
        }

        return [
            'id' => (string) $item->id,
            'slug' => $item->slug,
            'destinationSlug' => $item->destination_slug,
            'code' => $item->code,
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('location', $item->location),
            'category_key' => $item->category_key,
            ...$this->flatLocalized('category', $category),
            'category_assignments' => $categoryAssignments,
            'price' => $item->price,
            'rating' => $item->rating,
            'stars' => $item->stars,
            'reviews' => $item->reviews,
            'image' => $this->normalizeApiOutputPath($item->image),
            'amenities' => collect($item->amenities ?? [])->map(fn (Amenity $amenity) => [
                'id' => (string) $amenity->id,
                'name' => $amenity->name,
                'icon' => $amenity->icon,
            ])->values(),
            'tags' => $item->tags ?? [],
            'gallery' => $gallery,
            'city' => $item->details['city'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'country' => $item->details['country'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'description' => $item->details['description'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            ...$this->flatLocalized('city', $item->details['city'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            ...$this->flatLocalized('country', $item->details['country'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            ...$this->flatLocalized('description', $item->details['description'] ?? ['en' => '', 'fr' => '', 'ar' => '']),
            'rooms' => collect($item->rooms ?? [])->map(fn (HotelRoom $room) => [
                'id' => (string) $room->id,
                'name' => [
                    'en' => $room->name_en ?? '',
                    'fr' => $room->name_fr ?? '',
                    'ar' => $room->name_ar ?? '',
                ],
                'description' => [
                    'en' => $room->description_en ?? '',
                    'fr' => $room->description_fr ?? '',
                    'ar' => $room->description_ar ?? '',
                ],
                'pricePerNight' => (float) $room->price_per_night,
                'capacity' => (int) $room->capacity,
                'size' => (float) $room->size,
                'features' => $room->featureItems->pluck('label')->all(),
                'images' => $room->imageItems->map(fn ($img) => $this->normalizeApiOutputPath($img->path))->all(),
            ])->values(),
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

    private function flatLocalized(string $key, array|string|null $value): array
    {
        $value = $this->normalizeLocalizedValue($value);

        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function normalizeLocalizedValue(array|string|null $value, string $fallback = ''): array
    {
        if (is_array($value)) {
            return [
                'en' => $value['en'] ?? $fallback,
                'fr' => $value['fr'] ?? $fallback,
                'ar' => $value['ar'] ?? $fallback,
            ];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return [
                    'en' => $decoded['en'] ?? $fallback,
                    'fr' => $decoded['fr'] ?? $fallback,
                    'ar' => $decoded['ar'] ?? $fallback,
                ];
            }
        }

        $scalar = (string) ($value ?? $fallback);

        return [
            'en' => $scalar,
            'fr' => $scalar,
            'ar' => $scalar,
        ];
    }

    private function hotelDetails(Request $request, array $data, ?Model $existing, array $gallery, array $category = ['en' => '', 'fr' => '', 'ar' => '']): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('category', $data) || array_key_exists('category_en', $data) || array_key_exists('category_fr', $data) || array_key_exists('category_ar', $data)) {
            $details['category'] = $this->localized($data, 'category', $existing?->details['category'] ?? $category);
        } elseif (! empty($category['en']) || ! empty($category['fr']) || ! empty($category['ar'])) {
            $details['category'] = $category;
        }

        if (array_key_exists('city', $data) || array_key_exists('city_en', $data) || array_key_exists('city_fr', $data) || array_key_exists('city_ar', $data)) {
            $details['city'] = $this->localized($data, 'city', $existing?->details['city'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        if (array_key_exists('country', $data) || array_key_exists('country_en', $data) || array_key_exists('country_fr', $data) || array_key_exists('country_ar', $data)) {
            $details['country'] = $this->localized($data, 'country', $existing?->details['country'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description', $existing?->details['description'] ?? ['en' => '', 'fr' => '', 'ar' => '']);
        }

        $details['gallery'] = $gallery;

        return $details;
    }

    private function syncAmenities(Hotel $hotel, array $amenities): void
    {
        $amenityIds = [];

        foreach ($amenities as $amenityData) {
            if (! is_array($amenityData)) {
                continue;
            }

            $name = $this->normalizeLocalizedValue($amenityData['name'] ?? null);
            $name = [
                'en' => trim((string) ($name['en'] ?? '')),
                'fr' => trim((string) ($name['fr'] ?? '')),
                'ar' => trim((string) ($name['ar'] ?? '')),
            ];

            if ($name['en'] === '' && $name['fr'] === '' && $name['ar'] === '') {
                continue;
            }

            $icon = isset($amenityData['icon']) && is_string($amenityData['icon'])
                ? trim($amenityData['icon'])
                : null;

            $amenity = null;

            if (isset($amenityData['id']) && is_numeric($amenityData['id'])) {
                $amenity = Amenity::query()->find((int) $amenityData['id']);
                if ($amenity) {
                    $amenity->fill([
                        'name' => $name,
                        'icon' => $icon,
                    ]);
                    $amenity->save();
                }
            }

            if (! $amenity) {
                $amenity = Amenity::query()->updateOrCreate(
                    ['name' => $name],
                    ['icon' => $icon]
                );
            }

            $amenityIds[] = $amenity->id;
        }

        $hotel->amenities()->sync(array_values(array_unique($amenityIds)));
    }

    private function syncRooms(Hotel $hotel, array $rooms): void
    {
        $existingIds = [];

        foreach ($rooms as $index => $roomData) {
            if (! is_array($roomData) || ! $this->roomHasContent($roomData)) {
                continue;
            }

            $room = isset($roomData['id']) && is_numeric($roomData['id'])
                ? $hotel->rooms()->find($roomData['id'])
                : new HotelRoom(['hotel_id' => $hotel->id]);

            $roomImages = $this->normalizeRoomImages($roomData['images'] ?? []);

            // Map localized name/description into explicit columns
            $room->fill([
                'name_en' => is_array($roomData['name'] ?? null) ? ($roomData['name']['en'] ?? '') : ($roomData['name'] ?? ''),
                'name_fr' => is_array($roomData['name'] ?? null) ? ($roomData['name']['fr'] ?? '') : '',
                'name_ar' => is_array($roomData['name'] ?? null) ? ($roomData['name']['ar'] ?? '') : '',
                'description_en' => is_array($roomData['description'] ?? null) ? ($roomData['description']['en'] ?? '') : ($roomData['description'] ?? ''),
                'description_fr' => is_array($roomData['description'] ?? null) ? ($roomData['description']['fr'] ?? '') : '',
                'description_ar' => is_array($roomData['description'] ?? null) ? ($roomData['description']['ar'] ?? '') : '',
                'price_per_night' => (float) ($roomData['pricePerNight'] ?? 0),
                'capacity' => (int) ($roomData['capacity'] ?? 1),
                'size' => (float) ($roomData['size'] ?? 0),
            ]);
            $room->save();

            // Sync features (simple labels) and images
            $features = is_array($roomData['features'] ?? null) ? $roomData['features'] : [];
            $room->featureItems()->delete();
            foreach (array_values($features) as $i => $feature) {
                $label = is_array($feature) ? ($feature['name']['en'] ?? $feature['name'] ?? '') : (string) $feature;
                if ($label === '') {
                    continue;
                }
                $room->featureItems()->create([
                    'label' => $label,
                    'sort_order' => $i,
                ]);
            }

            $room->imageItems()->delete();
            foreach (array_values($roomImages) as $i => $path) {
                if (! $path) {
                    continue;
                }
                $room->imageItems()->create([
                    'path' => $path,
                    'sort_order' => $i,
                ]);
            }
            $existingIds[] = $room->id;
        }

        $hotel->rooms()->whereNotIn('id', $existingIds)->delete();
    }

    private function roomHasContent(array $roomData): bool
    {
        foreach (['name', 'description'] as $field) {
            $value = $roomData[$field] ?? null;

            if (is_string($value) && trim($value) !== '') {
                return true;
            }

            if (is_array($value)) {
                foreach (['en', 'fr', 'ar'] as $lang) {
                    if (isset($value[$lang]) && trim((string) $value[$lang]) !== '') {
                        return true;
                    }
                }
            }
        }

        foreach (['pricePerNight', 'capacity', 'size'] as $field) {
            if (! array_key_exists($field, $roomData)) {
                continue;
            }

            $value = $roomData[$field];

            if (is_numeric($value) && (float) $value > 0) {
                return true;
            }
        }

        foreach (['features', 'images'] as $field) {
            $value = $roomData[$field] ?? [];

            if (! is_array($value)) {
                continue;
            }

            foreach ($value as $item) {
                if (is_string($item) && trim($item) !== '') {
                    return true;
                }

                if (is_array($item)) {
                    foreach ($item as $nested) {
                        if (is_string($nested) && trim($nested) !== '') {
                            return true;
                        }

                        if (is_array($nested)) {
                            foreach ($nested as $leaf) {
                                if (is_string($leaf) && trim($leaf) !== '') {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Normalize room image items to stored paths.
     *
     * @param  array<int, mixed>  $images
     * @return array<int, string>
     */
    private function normalizeRoomImages(array $images): array
    {
        return array_values(array_filter(array_map(function (mixed $image): string {
            if ($image instanceof UploadedFile) {
                return '/storage/'.$image->store('uploads/hotels/rooms', 'public');
            }

            if (is_array($image) && isset($image['path']) && is_string($image['path'])) {
                return $this->normalizeStoredMediaPath($image['path']);
            }

            if (is_string($image)) {
                return $this->normalizeStoredMediaPath($image);
            }

            return '';
        }, $images)));
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

    private function syncCategoryAssignments(Model $entity, string $entityType, array $assignments): void
    {
        // Delete existing assignments for this entity
        EntityCategoryAssignment::where('entity_type', $entityType)
            ->where('entity_id', $entity->id)
            ->delete();

        $firstValue = null;

        foreach ($assignments as $typeKey => $valueKey) {
            $type = CategoryType::where('entity_type', $entityType)->where('key', $typeKey)->first();
            if (! $type) {
                continue;
            }
            $value = $type->values()->where('key', $valueKey)->first();
            if (! $value) {
                continue;
            }

            EntityCategoryAssignment::create([
                'entity_type' => $entityType,
                'entity_id' => $entity->id,
                'category_type_id' => $type->id,
                'category_value_id' => $value->id,
            ]);

            if (! $firstValue) {
                $firstValue = $value;
            }
        }

        // Update legacy columns from first assignment
        if ($firstValue && Schema::hasColumn('hotels', 'category_key')) {
            $entity->update([
                'category_key' => $firstValue->key,
                'category' => $firstValue->name,
            ]);
        }
    }
}
