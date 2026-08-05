<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminCategories;
use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\Destination;
use App\Models\EntityCategoryAssignment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminDestinationController extends Controller
{
    use HandlesAdminCategories, HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.destinations', now()->addMinutes(5), function () {
            return Destination::query()->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Destination::create($this->attributes($request));
        $this->syncCategoryAssignments($item, 'destinations', $request->input('category_assignments', []));
        $this->flushAdminCache('destinations', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Destination::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Destination::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->syncCategoryAssignments($item, 'destinations', $request->input('category_assignments', []));
        $this->flushAdminCache('destinations', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Destination::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('destinations', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['gallery', 'highlights']);

        $rules = [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['required', 'string', 'max:255'],
            'country_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            'about' => ['sometimes', 'nullable', 'string'],
            'about_en' => ['sometimes', 'nullable', 'string'],
            'about_fr' => ['sometimes', 'nullable', 'string'],
            'about_ar' => ['sometimes', 'nullable', 'string'],
            'gallery' => ['sometimes', 'nullable'],
            'gallery_files' => ['sometimes', 'array'],
            'highlights' => ['sometimes', 'nullable'],
            'highlights.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'highlights.*.name' => ['sometimes', 'array'],
            'highlights.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'highlights.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'highlights.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bestTime' => ['sometimes', 'nullable', 'string'],
            'bestTime_en' => ['sometimes', 'nullable', 'string'],
            'bestTime_fr' => ['sometimes', 'nullable', 'string'],
            'bestTime_ar' => ['sometimes', 'nullable', 'string'],
            'language' => ['sometimes', 'nullable', 'string'],
            'language_en' => ['sometimes', 'nullable', 'string'],
            'language_fr' => ['sometimes', 'nullable', 'string'],
            'language_ar' => ['sometimes', 'nullable', 'string'],
            'currency' => ['sometimes', 'nullable', 'string'],
            'currency_en' => ['sometimes', 'nullable', 'string'],
            'currency_fr' => ['sometimes', 'nullable', 'string'],
            'currency_ar' => ['sometimes', 'nullable', 'string'],
            'weather' => ['sometimes', 'nullable', 'string'],
            'weather_en' => ['sometimes', 'nullable', 'string'],
            'weather_fr' => ['sometimes', 'nullable', 'string'],
            'weather_ar' => ['sometimes', 'nullable', 'string'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, string $fallback = ''): array => $this->localized(
            $data,
            $key,
            $fallback,
            is_array($existing?->{$key} ?? null) ? $existing->{$key} : null,
        );

        $name = $localized('name');
        $title = $localized('title', $name['en']);
        $label = $name['en'] ?: $title['en'] ?: 'destination';
        $slugBase = is_string($label) ? $label : 'destination';
        $slug = $existing->slug ?? Str::slug($slugBase).'-'.Str::lower(Str::random(5));
        $description = $localized('description', '');

        $gallery = $this->handleGallery($request, $existing?->details['gallery'] ?? [], 'uploads/destinations');

        $categoryKey = $data['category_key']
            ?? $data['category']
            ?? $request->input('category')
            ?? ($existing?->category_key ?? 'beach');

        return [
            'slug' => $slug,
            'name' => $name,
            'country' => $localized('country'),
            'category_key' => $categoryKey,
            'price' => (int) ($data['price'] ?? $existing?->price ?? 0),
            'rating' => (float) ($data['rating'] ?? $existing?->rating ?? 0),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/destinations'),
            'description' => $description,
            'details' => $this->destinationDetails($data, $existing, $description, $gallery),
        ];
    }

    private function adminPayload(Model $item): array
    {
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
            'id' => (int) $item->id,
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('country', $item->country),
            'category_key' => $item->category_key,
            ...$this->flatLocalized('category', $this->getCategory($item)),
            'category_assignments' => $categoryAssignments,
            'price' => $item->price,
            'rating' => (float) $item->rating,
            'image' => $this->normalizeApiOutputPath($item->image),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('about', $item->details['about'] ?? null),
            'gallery' => array_map(fn ($img) => $this->normalizeApiOutputPath($img), $item->details['gallery'] ?? [$item->image]),
            'highlights' => $item->details['highlights'] ?? [],
            ...$this->flatLocalized('bestTime', $item->details['bestTime'] ?? null),
            ...$this->flatLocalized('language', $item->details['language'] ?? null),
            ...$this->flatLocalized('currency', $item->details['currency'] ?? null),
            ...$this->flatLocalized('weather', $item->details['weather'] ?? null),
        ];
    }

    private function getCategory(Model $item): ?array
    {
        $category = Category::where('entity_type', 'destinations')
            ->where('key', $item->category_key)
            ->first();

        return $category ? $category->name : ['en' => $item->category_key, 'fr' => $item->category_key, 'ar' => $item->category_key];
    }

    private function localized(array $data, string $key, string $fallback = '', ?array $existing = null): array
    {
        $base = $data[$key] ?? $fallback;

        return [
            'fr' => $data[$key.'_fr'] ?? ($existing['fr'] ?? $base ?? ''),
            'ar' => $data[$key.'_ar'] ?? ($existing['ar'] ?? $base ?? ''),
            'en' => $data[$key.'_en'] ?? ($existing['en'] ?? $base ?? ''),
        ];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function destinationDetails(array $data, ?Model $existing, array $description, array $gallery): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('about', $data) || array_key_exists('about_en', $data) || array_key_exists('about_fr', $data) || array_key_exists('about_ar', $data)) {
            $details['about'] = $this->localized($data, 'about', $description['en'] ?? '');
        }

        $details['gallery'] = $gallery;

        if (array_key_exists('highlights', $data)) {
            $details['highlights'] = $data['highlights'] ?? [];
        }

        foreach (['bestTime', 'language', 'currency', 'weather'] as $key) {
            if (array_key_exists($key, $data) || array_key_exists($key.'_en', $data) || array_key_exists($key.'_fr', $data) || array_key_exists($key.'_ar', $data)) {
                $details[$key] = $this->localized($data, $key);
            }
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
        // old admin cache keys
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }

        // public-facing cache keys used by DestinationController and friends
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

        if ($firstValue && Schema::hasColumn('destinations', 'category_key')) {
            $entity->update([
                'category_key' => $firstValue->key,
                'category' => $firstValue->name,
            ]);
        }
    }
}
