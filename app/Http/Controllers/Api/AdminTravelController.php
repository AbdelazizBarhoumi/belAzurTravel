<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use App\Models\GalleryImage;
use App\Models\Travel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminTravelController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.travels', now()->addMinutes(5), function () {
            return Travel::query()
                ->oldest('id')
                ->get()
                ->map(fn (Model $item) => $this->adminPayload($item))
                ->all();
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Travel::create($this->attributes($request));
        $this->syncCategoryAssignments($item, 'travels', $request->input('category_assignments', []));
        $this->flushAdminCache('travels', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Travel::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Travel::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->syncCategoryAssignments($item, 'travels', $request->input('category_assignments', []));
        $this->flushAdminCache('travels', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Travel::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('travels', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['gallery', 'itinerary', 'includes', 'excludes']);

        $rules = [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_days' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'duration_nights' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_group' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            'itinerary' => ['sometimes', 'nullable'],
            'includes' => ['sometimes', 'nullable'],
            'excludes' => ['sometimes', 'nullable'],
            'images' => ['sometimes', 'nullable', 'array'],
            'gallery' => ['sometimes', 'nullable'],
            'category_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            // Filter fields
            'istanbul' => ['sometimes', 'boolean'],
            'asie' => ['sometimes', 'boolean'],
            'europe' => ['sometimes', 'boolean'],
            'afrique_nord' => ['sometimes', 'boolean'],
            'jeune' => ['sometimes', 'boolean'],
            'tranquille' => ['sometimes', 'boolean'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $name = $localized('name');

        $categoryKey = (string) (
            $data['category_key']
            ?? $existing?->category_key
            ?? $data['category']
            ?? ''
        );
        $category = $categoryKey !== ''
            ? Category::query()
                ->where('entity_type', 'travels')
                ->where('key', $categoryKey)
                ->first()
            : null;
        $categoryName = $category?->name ?? $localized('category', $existing?->category ? ($existing->category['en'] ?? '') : '');

        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'travel').'-'.Str::lower(Str::random(4));

        $hasImagesInput = $request->has('images');
        $hasGalleryInput = $request->has('gallery');

        $galleryInput = $hasImagesInput
            ? $request->input('images', [])
            : ($hasGalleryInput ? $request->input('gallery', []) : []);

        if (is_string($galleryInput)) {
            $galleryInput = $this->splitLines($galleryInput);
        }

        $isIdArray = is_array($galleryInput) && count($galleryInput) > 0 && collect($galleryInput)->every(fn ($v) => is_int($v) || (is_string($v) && ctype_digit($v)));

        if ($isIdArray) {
            $gallery = array_map(fn ($v) => (int) $v, $galleryInput);
        } else {
            $gallery = $this->handleGallery($request->merge(['gallery' => $galleryInput]), $existing?->images ?? [], 'uploads/travels');
        }

        $details = $existing?->details ?? [];

        if (array_key_exists('itinerary', $data)) {
            $details['itinerary'] = $data['itinerary'] ?? [];
        }

        if (array_key_exists('includes', $data)) {
            $details['inclusions'] = $data['includes'] ?? [];
        }

        if (array_key_exists('excludes', $data)) {
            $details['excludes'] = $data['excludes'] ?? [];
        }

        return [
            'slug' => $slug,
            'name' => $name,
            'location' => $localized('location'),
            'category_key' => $categoryKey !== '' ? $categoryKey : $existing?->category_key,
            'category' => $categoryName,
            'duration' => $localized('duration'),
            'duration_days' => (int) ($data['duration_days'] ?? $existing?->duration_days ?? 0),
            'duration_nights' => (int) ($data['duration_nights'] ?? $existing?->duration_nights ?? 0),
            'max_group' => (int) ($data['max_group'] ?? $existing?->max_group ?? 0),
            'price' => (int) ($data['price'] ?? 0),
            'rating' => (float) ($data['rating'] ?? 0),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/travels'),
            'description' => $localized('description', ''),
            'details' => $details,
            'images' => $gallery,
            'itinerary' => $data['itinerary'] ?? $existing?->itinerary ?? [],
            'includes' => $data['includes'] ?? $existing?->includes ?? [],
            'excludes' => $data['excludes'] ?? $existing?->excludes ?? [],
        ];
    }

    private function adminPayload(Model $item): array
    {
        $images = $this->resolveImageUrls($item->images ?? []);

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
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('location', $item->location),
            'category_key' => $item->category_key,
            ...$this->flatLocalized('category', $item->category ?? ['en' => '', 'fr' => '', 'ar' => '']),
            'category_assignments' => $categoryAssignments,
            ...$this->flatLocalized('duration', $item->duration),
            'duration_days' => $item->duration_days,
            'duration_nights' => $item->duration_nights,
            'max_group' => $item->max_group,
            'price' => $item->price,
            'rating' => $item->rating,
            'image' => $this->normalizeApiOutputPath($item->image),
            'itinerary' => $item->itinerary ?? [],
            'includes' => $item->includes ?? [],
            'excludes' => $item->excludes ?? [],
            'gallery' => $images,
            'images' => $images,
        ];
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;

        return ['fr' => $data[$key.'_fr'] ?? $base ?? '', 'ar' => $data[$key.'_ar'] ?? $base ?? '', 'en' => $data[$key.'_en'] ?? $base ?? ''];
    }

    private function splitLines(string $value): array
    {
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }

    private function flatLocalized(string $key, array|string|null $value): array
    {
        if (! is_array($value)) {
            $value = ['en' => (string) $value, 'fr' => (string) $value, 'ar' => (string) $value];
        }

        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function resolveImageUrls(array $images): array
    {
        if (count($images) === 0) {
            return [];
        }

        $ids = collect($images)
            ->filter(fn ($value) => is_int($value) || (is_string($value) && ctype_digit($value)))
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values();

        $urlsById = $ids->isEmpty()
            ? []
            : GalleryImage::query()
                ->whereIn('id', $ids->all())
                ->pluck('url', 'id')
                ->all();

        return collect($images)
            ->map(function ($value) use ($urlsById) {
                if (is_int($value) || (is_string($value) && ctype_digit($value))) {
                    return $urlsById[(int) $value] ?? null;
                }

                return is_string($value) ? $value : null;
            })
            ->filter()
            ->values()
            ->all();
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

    private function syncCategoryAssignments(Model $entity, string $entityType, array $assignments): void
    {
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

        if ($firstValue && Schema::hasColumn('travels', 'category_key')) {
            $entity->update([
                'category_key' => $firstValue->key,
                'category' => $firstValue->name,
            ]);
        }
    }
}
