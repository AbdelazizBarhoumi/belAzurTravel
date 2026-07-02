<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminCategoryTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entityType = $request->query('type');

        $types = Cache::remember(
            $this->cacheKey($entityType),
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
            'label' => ['required', 'array'],
            'label.en' => ['required', 'string'],
            'label.fr' => ['required', 'string'],
            'label.ar' => ['required', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $key = Str::slug($data['label']['en']);

        $baseKey = $key;
        $counter = 1;
        while (CategoryType::where('entity_type', $data['entity_type'])->where('key', $key)->exists()) {
            $key = $baseKey . '-' . $counter++;
        }

        $type = CategoryType::create([
            'entity_type' => $data['entity_type'],
            'key' => $key,
            'label' => $data['label'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        $this->clearCache($data['entity_type']);

        return response()->json(['data' => $type], 201);
    }

    public function update(Request $request, CategoryType $categoryType): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'array'],
            'label.en' => ['required', 'string'],
            'label.fr' => ['required', 'string'],
            'label.ar' => ['required', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $updateData = ['label' => $data['label']];
        if (isset($data['sort_order'])) {
            $updateData['sort_order'] = $data['sort_order'];
        }

        $categoryType->update($updateData);
        $this->clearCache($categoryType->entity_type);

        return response()->json(['data' => $categoryType->fresh(['values'])]);
    }

    public function destroy(CategoryType $categoryType): JsonResponse
    {
        $type = $categoryType->entity_type;

        // Check if any entities use values from this type
        $count = EntityCategoryAssignment::where('category_type_id', $categoryType->id)->count();

        if ($count > 0) {
            $affected = $this->getAffectedEntities($categoryType);

            return response()->json([
                'message' => "This category type is assigned to {$count} item(s). Deleting it will remove all assignments.",
                'count' => $count,
                'affected_items' => $affected,
                'requires_confirmation' => true,
            ], 409);
        }

        $categoryType->delete();
        $this->clearCache($type);

        return response()->json(['message' => 'Category type deleted']);
    }

    // --- Values endpoints ---

    public function values(CategoryType $categoryType): JsonResponse
    {
        $values = $categoryType->values()->get();

        return response()->json(['data' => $values]);
    }

    public function storeValue(Request $request, CategoryType $categoryType): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['required', 'string'],
        ]);

        $key = Str::slug($data['name']['en']);

        $baseKey = $key;
        $counter = 1;
        while (CategoryValue::where('category_type_id', $categoryType->id)->where('key', $key)->exists()) {
            $key = $baseKey . '-' . $counter++;
        }

        $value = CategoryValue::create([
            'category_type_id' => $categoryType->id,
            'key' => $key,
            'name' => $data['name'],
        ]);

        $this->clearCache($categoryType->entity_type);

        return response()->json(['data' => $value], 201);
    }

    public function updateValue(Request $request, CategoryType $categoryType, CategoryValue $value): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['required', 'string'],
        ]);

        $value->update(['name' => $data['name']]);

        // Sync denormalized data on entities using this value
        $this->syncEntityCategoryNames($value);

        $this->clearCache($categoryType->entity_type);

        return response()->json(['data' => $value->fresh()]);
    }

    public function destroyValue(CategoryType $categoryType, CategoryValue $value): JsonResponse
    {
        $count = EntityCategoryAssignment::where('category_value_id', $value->id)->count();

        if ($count > 0) {
            $affected = DB::table('entity_category_assignments')
                ->where('category_value_id', $value->id)
                ->get()
                ->map(fn($row) => [
                    'name' => "{$row->entity_type} #{$row->entity_id}",
                    'slug' => "{$row->entity_type}-{$row->entity_id}",
                ])
                ->toArray();

            return response()->json([
                'message' => "This value is assigned to {$count} item(s).",
                'count' => $count,
                'affected_items' => $affected,
                'requires_confirmation' => true,
            ], 409);
        }

        $value->delete();
        $this->clearCache($categoryType->entity_type);

        return response()->json(['message' => 'Category value deleted']);
    }

    // --- Helpers ---

    private function cacheKey(?string $entityType): string
    {
        return $entityType ? "category-types:{$entityType}" : 'category-types:all';
    }

    private function clearCache(?string $entityType = null): void
    {
        Cache::forget('category-types:all');
        if ($entityType) {
            Cache::forget($this->cacheKey($entityType));
        }
    }

    private function getAffectedEntities(CategoryType $categoryType): array
    {
        $assignments = EntityCategoryAssignment::where('category_type_id', $categoryType->id)
            ->with('categoryValue')
            ->get();

        return $assignments->map(fn($a) => [
            'name' => "{$a->entity_type} #{$a->entity_id}",
            'slug' => "{$a->entity_type}-{$a->entity_id}",
        ])->toArray();
    }

    private function syncEntityCategoryNames(CategoryValue $value): void
    {
        $assignments = EntityCategoryAssignment::where('category_value_id', $value->id)->get();

        foreach ($assignments as $assignment) {
            $tableName = $this->getTableName($assignment->entity_type);
            if (!$tableName || !DB::getSchemaBuilder()->hasColumn($tableName, 'category')) {
                continue;
            }

            DB::table($tableName)
                ->where('id', $assignment->entity_id)
                ->update(['category' => json_encode($value->name)]);
        }
    }

    private function getTableName(string $entityType): ?string
    {
        return match ($entityType) {
            'destinations' => 'destinations',
            'hotels' => 'hotels',
            'tours' => 'tours',
            'cars' => 'cars',
            'events' => 'events',
            'deals' => 'deals',
            'blog' => 'blog_posts',
            default => null,
        };
    }
}
