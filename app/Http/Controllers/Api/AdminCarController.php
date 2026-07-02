<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * AdminCarController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload or string path.
 * - Gallery: send `gallery` as an array of existing paths and/or
 *   `gallery_files` as uploaded image files. Uploaded files stored under
 *   `storage/app/public/uploads` and persisted with `/storage/` prefix.
 */
class AdminCarController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.cars', now()->addMinutes(5), function () {
            return Car::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $attrs = $this->attributes($request);
        $item = Car::create($attrs);
        $this->syncCategoryAssignments($item, 'cars', $request->input('category_assignments', []));
        $this->flushAdminCache('cars', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Car::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Car::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->syncCategoryAssignments($item, 'cars', $request->input('category_assignments', []));
        $this->flushAdminCache('cars', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Car::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('cars', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['gallery', 'features', 'policy']);

        $rules = [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'seats' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'fuel' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fuel_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fuel_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fuel_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            'gallery' => ['sometimes', 'nullable'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['file', 'image', 'max:4096'],
            'features' => ['sometimes', 'nullable', 'array'],
            'features.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'features.*.name' => ['sometimes', 'array'],
            'features.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'features.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'features.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy' => ['sometimes', 'nullable', 'array'],
            'policy.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy.*.name' => ['sometimes', 'array'],
            'policy.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];

        $data = $request->validate($rules);

        $name = $this->localized($data, 'name', $existing?->name ?? null, 'car');
        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'car').'-'.Str::lower(Str::random(4));
        $category = $this->resolveCategory($data, $existing);

        $gallery = $this->handleGallery($request, data_get($existing, 'details.gallery', []), 'uploads/cars');

        return [
            'slug' => $slug,
            'name' => $name,
            'category_key' => $category['key'] !== '' ? $category['key'] : null,
            'category' => $category['name'],
            'price' => (int) ($data['price'] ?? 0),
            'seats' => (int) ($data['seats'] ?? 0),
            'fuel' => $this->localized($data, 'fuel', $existing?->fuel),
            'transmission' => $this->localized($data, 'transmission', $existing?->transmission),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/cars'),
            'details' => $this->carDetails($data, $existing, $this->localized($data, 'description', data_get($existing, 'details.description')), $gallery),
        ];
    }

    private function adminPayload(Model $item): array
    {
        $gallery = array_map(fn ($img) => $this->normalizeApiOutputPath($img), $item->details['gallery'] ?? [$item->image]);
        $category = $this->resolveCategory([], $item);

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
            ...$this->flatLocalized('name', $item->name),
            'category_key' => $category['key'] !== '' ? $category['key'] : null,
            ...$this->flatLocalized('category', $category['name']),
            'category_assignments' => $categoryAssignments,
            'price' => $item->price,
            'seats' => $item->seats,
            ...$this->flatLocalized('fuel', $item->fuel),
            ...$this->flatLocalized('transmission', $item->transmission),
            'image' => $this->normalizeApiOutputPath($item->image),
            ...$this->flatLocalized('description', $item->details['description'] ?? []),
            'gallery' => $gallery,
            'images' => $gallery,
            'features' => $item->details['features'] ?? [],
            'policy' => $item->details['policy'] ?? [],
        ];
    }

    /**
     * Normalize stored media paths for API output.
     *
     * - If stored as "storage/<path>", return "/<path>"
     * - If stored as an absolute URL, return the path portion with a leading slash
     * - If stored as "images/.." or " /images/...", return with leading slash
     */
    private function carDetails(array $data, ?Model $existing, array $description, array $gallery): array
    {
        $details = $existing?->details ?? [];

        $details['gallery'] = $gallery;

        if (array_key_exists('features', $data)) {
            $details['features'] = $data['features'] ?? [];
        }

        if (array_key_exists('policy', $data)) {
            $details['policy'] = $data['policy'] ?? [];
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description', data_get($existing, 'details.description'));
        }

        return $details;
    }

    private function localized(array $data, string $key, array|string|null $existing = null, string $fallback = ''): array
    {
        $base = $data[$key] ?? null;
        $existing = $this->normalizeLocalizedValue($existing, $fallback);

        return [
            'fr' => $data[$key.'_fr'] ?? $base ?? ($existing['fr'] ?? $fallback),
            'ar' => $data[$key.'_ar'] ?? $base ?? ($existing['ar'] ?? $fallback),
            'en' => $data[$key.'_en'] ?? $base ?? ($existing['en'] ?? $fallback),
        ];
    }

    private function flatLocalized(string $key, array|string|null $value): array
    {
        $value = $this->normalizeLocalizedValue($value);

        return [
            $key => $value['en'] ?? '',
            $key.'_fr' => $value['fr'] ?? '',
            $key.'_ar' => $value['ar'] ?? '',
            $key.'_en' => $value['en'] ?? '',
        ];
    }

    /**
     * @return array{key: string, name: array{en: string, fr: string, ar: string}}
     */
    private function resolveCategory(array $data, ?Model $existing = null): array
    {
        $categories = Category::query()
            ->where('entity_type', 'cars')
            ->get();

        $incomingCategory = $this->normalizeLocalizedValue(
            [
                'en' => $data['category_en'] ?? ($data['category'] ?? null),
                'fr' => $data['category_fr'] ?? ($data['category'] ?? null),
                'ar' => $data['category_ar'] ?? ($data['category'] ?? null),
            ],
            '',
        );

        $existingCategory = $this->normalizeLocalizedValue(
            data_get($existing, 'category'),
            '',
        );

        $candidateValues = array_filter([
            $this->stringValue($data['category_key'] ?? null),
            $this->stringValue(data_get($existing, 'category_key')),
            $this->stringValue($data['category'] ?? null),
            $this->stringValue($data['category_en'] ?? null),
            $this->stringValue($data['category_fr'] ?? null),
            $this->stringValue($data['category_ar'] ?? null),
            $this->stringValue($incomingCategory['en'] ?? null),
            $this->stringValue($incomingCategory['fr'] ?? null),
            $this->stringValue($incomingCategory['ar'] ?? null),
            $this->stringValue($existingCategory['en'] ?? null),
            $this->stringValue($existingCategory['fr'] ?? null),
            $this->stringValue($existingCategory['ar'] ?? null),
        ]);

        foreach ($candidateValues as $candidate) {
            $match = $categories->first(function (Category $category) use ($candidate) {
                $names = array_filter([
                    $category->key,
                    data_get($category->name, 'en'),
                    data_get($category->name, 'fr'),
                    data_get($category->name, 'ar'),
                ]);

                return in_array($candidate, $names, true);
            });

            if ($match) {
                return [
                    'key' => $match->key,
                    'name' => $this->normalizeLocalizedValue($match->name, $match->key),
                ];
            }
        }

        $fallbackKey = $this->stringValue($data['category_key'] ?? null)
            ?: $this->stringValue(data_get($existing, 'category_key'));

        return [
            'key' => $fallbackKey,
            'name' => $incomingCategory['en'] !== ''
                || $incomingCategory['fr'] !== ''
                || $incomingCategory['ar'] !== ''
                ? $incomingCategory
                : $existingCategory,
        ];
    }

    private function stringValue(mixed $value): string
    {
        return is_string($value) ? trim($value) : '';
    }

    private function localizedValue(array|string|null $value): string
    {
        if (is_array($value)) {
            return (string) ($value['en'] ?? $value['fr'] ?? $value['ar'] ?? '');
        }

        return (string) ($value ?? '');
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

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
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

        if ($firstValue && Schema::hasColumn('cars', 'category_key')) {
            $entity->update([
                'category_key' => $firstValue->key,
                'category' => $firstValue->name,
            ]);
        }
    }
}
