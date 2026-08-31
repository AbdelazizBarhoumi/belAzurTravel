<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');

        $categories = Cache::remember(
            $this->cacheKey($type),
            now()->addMinutes(5),
            function () use ($type) {
                $query = Category::query();

                if ($type) {
                    $query->where('entity_type', $type);
                }

                return $query->get();
            },
        );

        return response()
            ->json(['data' => $categories])
            ->header('Cache-Control', 'no-cache, must-revalidate');
    }

    public function typesByEntity(Request $request): JsonResponse
    {
        $entityType = $request->query('entity_type');

        $cacheKey = $entityType ? "category-types-nested:{$entityType}" : 'category-types-nested:all';

        $types = Cache::remember(
            $cacheKey,
            now()->addMinutes(5),
            function () use ($entityType) {
                $query = CategoryType::with('values');

                if ($entityType) {
                    $query->where('entity_type', $entityType);
                }

                return $query->orderBy('sort_order')->get();
            },
        );

        return response()
            ->json(['data' => $types])
            ->header('Cache-Control', 'no-cache, must-revalidate');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'entity_type' => ['required', 'string'],
            'name' => ['required', 'array'],
            'name.en' => ['nullable', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['nullable', 'string'],
        ]);

        $key = Str::slug($data['name']['en'] ?? $data['name']['fr']);

        // Ensure key uniqueness for this entity type
        $baseKey = $key;
        $counter = 1;
        while (Category::where('entity_type', $data['entity_type'])->where('key', $key)->exists()) {
            $key = $baseKey.'-'.$counter++;
        }

        $category = Category::create([
            'entity_type' => $data['entity_type'],
            'key' => $key,
            'name' => $data['name'],
        ]);

        $this->clearCategoryCache($data['entity_type']);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.en' => ['nullable', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['nullable', 'string'],
        ]);

        $oldKey = $category->key;
        $category->update(['name' => $data['name']]);

        // If we wanted to update the key we could, but usually keys should be stable.
        // For now, we only update the name labels. Consistency is maintained by the key.

        // Update all entities using this category to reflect the new name if they store it denormalized
        $this->syncEntities($category, $oldKey);
        $this->clearCategoryCache($category->entity_type);
        $this->clearEntityCaches($category->entity_type);

        return response()->json(['data' => $category]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $type = $category->entity_type;
        $key = $category->key;

        // Check if there are entities using this category
        $count = $this->getEntityCount($type, $key);

        if ($request->query('force') !== 'true' && $count > 0) {
            $affected = $this->getAffectedEntities($type, $key);

            return response()->json([
                'message' => "This category is assigned to {$count} item(s). Deleting it will set their category to null.",
                'count' => $count,
                'affected_items' => $affected,
                'requires_confirmation' => true,
            ], 409);
        }

        // Nullify categories in entities
        $this->nullifyEntities($type, $key);

        $category->delete();
        $this->clearCategoryCache($type);
        $this->clearEntityCaches($type);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function cacheKey(?string $type = null): string
    {
        return $type ? "categories:type:{$type}" : 'categories:all';
    }

    private function clearCategoryCache(?string $type = null): void
    {
        Cache::forget('categories:all');

        if ($type) {
            Cache::forget($this->cacheKey($type));
        }

        // Also clear category types caches (both systems coexist)
        Cache::forget('category-types:all');
        Cache::forget('category-types-nested:all');
        if ($type) {
            Cache::forget("category-types:{$type}");
            Cache::forget("category-types-nested:{$type}");
        }
    }

    private function clearEntityCaches(string $type): void
    {
        $cacheType = $this->cacheTypeForEntityType($type);

        if (! $cacheType) {
            return;
        }

        Cache::forget("admin.entity.{$cacheType}");
        Cache::forget("entity.{$cacheType}.index");
        Cache::forget("{$cacheType}.index");

        $table = $this->getTableName($type);

        if (! $table) {
            return;
        }

        $identifiers = DB::table($table)
            ->whereNotNull('slug')
            ->pluck('slug');

        foreach ($identifiers as $identifier) {
            if (! is_string($identifier) || $identifier === '') {
                continue;
            }

            Cache::forget("entity.{$cacheType}.{$identifier}");
            Cache::forget("{$cacheType}.{$identifier}");
        }
    }

    private function cacheTypeForEntityType(string $type): ?string
    {
        return match ($type) {
            'blog' => 'blog-posts',
            'destinations', 'hotels', 'tours', 'cars', 'events', 'deals' => $type,
            default => null,
        };
    }

    private function getEntityCount(string $type, string $key): int
    {
        $table = $this->getTableName($type);
        if (! $table) {
            return 0;
        }

        return DB::table($table)->where('category_key', $key)->count();
    }

    private function getAffectedEntities(string $type, string $key): array
    {
        $table = $this->getTableName($type);
        if (! $table) {
            return [];
        }

        $nameColumn = in_array($table, ['events', 'deals', 'blog_posts']) ? 'title' : 'name';

        return DB::table($table)
            ->where('category_key', $key)
            ->select('slug', $nameColumn)
            ->get()
            ->map(fn ($row) => [
                'name' => $this->extractLocalizedName($row->$nameColumn, 'en'),
                'slug' => $row->slug,
            ])
            ->toArray();
    }

    private function extractLocalizedName($columnValue, string $locale = 'en'): string
    {
        if (is_array($columnValue) && isset($columnValue[$locale])) {
            return $columnValue[$locale];
        }

        if (is_string($columnValue)) {
            $decoded = json_decode($columnValue, true);
            if (is_array($decoded) && isset($decoded[$locale])) {
                return $decoded[$locale];
            }

            return $columnValue;
        }

        return '';
    }

    private function nullifyEntities(string $type, string $key): void
    {
        $table = $this->getTableName($type);
        if (! $table) {
            return;
        }

        $update = ['category_key' => null];

        if (Schema::hasColumn($table, 'category')) {
            $update['category'] = null;
        }

        DB::table($table)->where('category_key', $key)->update($update);
    }

    private function syncEntities(Category $category, string $oldKey): void
    {
        $table = $this->getTableName($category->entity_type);
        if (! $table) {
            return;
        }

        // Only update denormalized `category` column where it exists
        if (Schema::hasColumn($table, 'category')) {
            DB::table($table)->where('category_key', $oldKey)->update([
                'category' => json_encode($category->name),
            ]);
        }
    }

    private function getTableName(string $type): ?string
    {
        $map = [
            'destinations' => 'destinations',
            'hotels' => 'hotels',
            'tours' => 'tours',
            'cars' => 'cars',
            'events' => 'events',
            'deals' => 'deals',
            'blog' => 'blog_posts',
        ];

        return $map[$type] ?? null;
    }
}
