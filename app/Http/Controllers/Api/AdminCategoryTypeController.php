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
            'label.en' => ['nullable', 'string'],
            'label.fr' => ['required', 'string'],
            'label.ar' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'filter_style' => ['nullable', 'string', 'in:pills,checkbox,dropdown,slider,radio'],
            'multi' => ['nullable', 'boolean'],
        ]);

        $key = Str::slug($data['label']['en'] ?? $data['label']['fr']);

        $baseKey = $key;
        $counter = 1;
        while (CategoryType::where('entity_type', $data['entity_type'])->where('key', $key)->exists()) {
            $key = $baseKey.'-'.$counter++;
        }

        $type = CategoryType::create([
            'entity_type' => $data['entity_type'],
            'key' => $key,
            'label' => $data['label'],
            'sort_order' => $data['sort_order'] ?? 0,
            'filter_style' => $data['filter_style'] ?? 'pills',
            'multi' => $data['multi'] ?? false,
        ]);

        $this->clearCache($data['entity_type']);

        return response()->json(['data' => $type], 201);
    }

    public function update(Request $request, CategoryType $categoryType): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'array'],
            'label.en' => ['nullable', 'string'],
            'label.fr' => ['required', 'string'],
            'label.ar' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'filter_style' => ['nullable', 'string', 'in:pills,checkbox,dropdown,slider,radio'],
            'multi' => ['nullable', 'boolean'],
        ]);

        $updateData = ['label' => $data['label']];
        if (isset($data['sort_order'])) {
            $updateData['sort_order'] = $data['sort_order'];
        }
        if (isset($data['filter_style'])) {
            $updateData['filter_style'] = $data['filter_style'];
        }
        if (array_key_exists('multi', $data)) {
            $updateData['multi'] = (bool) $data['multi'];
        }

        $categoryType->update($updateData);
        // Only clear cache if something actually changed
        if ($categoryType->wasChanged()) {
            $this->clearCache($categoryType->entity_type);
        }

        return response()->json(['data' => $categoryType->fresh(['values'])]);
    }

    public function destroy(Request $request, CategoryType $categoryType): JsonResponse
    {
        $type = $categoryType->entity_type;

        // Check if any entities use values from this type
        $count = EntityCategoryAssignment::where('category_type_id', $categoryType->id)->count();

        if ($request->query('force') !== 'true' && $count > 0) {
            $affected = $this->getAffectedEntities($categoryType);

            return response()->json([
                'message' => "This category type is assigned to {$count} item(s). Deleting it will remove all assignments.",
                'count' => $count,
                'affected_items' => $affected,
                'requires_confirmation' => true,
            ], 409);
        }

        $valueKeys = $categoryType->values()->pluck('key')->all();

        $this->deleteAssignmentsForType($categoryType->id);
        $this->nullifyEntitiesForValueKeys($type, $valueKeys);

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
            'name.en' => ['nullable', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $key = Str::slug($data['name']['en'] ?? $data['name']['fr']);

        $baseKey = $key;
        $counter = 1;
        while (CategoryValue::where('category_type_id', $categoryType->id)->where('key', $key)->exists()) {
            $key = $baseKey.'-'.$counter++;
        }

        $value = CategoryValue::create([
            'category_type_id' => $categoryType->id,
            'key' => $key,
            'name' => $data['name'],
            'color' => $data['color'] ?? null,
        ]);

        $this->clearCache($categoryType->entity_type);

        return response()->json(['data' => $value], 201);
    }

    public function updateValue(Request $request, CategoryType $categoryType, CategoryValue $value): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.en' => ['nullable', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $updateData = ['name' => $data['name']];
        if (array_key_exists('color', $data)) {
            $updateData['color'] = $data['color'];
        }
        $value->update($updateData);

        // Only sync and clear cache if something actually changed
        if ($value->wasChanged()) {
            $this->syncEntityCategoryNames($value);
            $this->clearCache($categoryType->entity_type);
        }

        return response()->json(['data' => $value->fresh()]);
    }

    public function destroyValue(Request $request, CategoryType $categoryType, CategoryValue $value): JsonResponse
    {
        $count = EntityCategoryAssignment::where('category_value_id', $value->id)->count();

        if ($request->query('force') !== 'true' && $count > 0) {
            $affected = DB::table('entity_category_assignments')
                ->where('category_value_id', $value->id)
                ->get()
                ->map(fn ($row) => [
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

        $this->deleteAssignmentsForValue($value->id);
        $this->nullifyEntitiesForValueKeys($categoryType->entity_type, [$value->key]);

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
        // Admin cache keys
        Cache::forget('category-types:all');
        if ($entityType) {
            Cache::forget($this->cacheKey($entityType));
        }

        // Public API cache keys (used by AdminCategoryController::typesByEntity)
        Cache::forget('category-types-nested:all');
        if ($entityType) {
            Cache::forget("category-types-nested:{$entityType}");
        }

        // Admin entity caches (so add/edit modals reflect category type changes)
        $entityCacheMap = [
            'hotels' => 'admin.entity.hotels',
            'tours' => 'admin.entity.tours',
            'travels' => 'admin.entity.travels',
            'events' => 'admin.entity.events',
            'deals' => 'admin.entity.deals',
            'destinations' => 'admin.entity.destinations',
            'cars' => 'admin.entity.cars',
            'blog' => 'admin.entity.blog-posts',
        ];
        foreach ($entityCacheMap as $cacheKey) {
            Cache::forget($cacheKey);
        }
    }

    private function getAffectedEntities(CategoryType $categoryType): array
    {
        $assignments = EntityCategoryAssignment::where('category_type_id', $categoryType->id)
            ->with('categoryValue')
            ->get();

        return $assignments->map(fn ($a) => [
            'name' => "{$a->entity_type} #{$a->entity_id}",
            'slug' => "{$a->entity_type}-{$a->entity_id}",
        ])->toArray();
    }

    private function syncEntityCategoryNames(CategoryValue $value): void
    {
        $assignments = EntityCategoryAssignment::where('category_value_id', $value->id)->get();

        foreach ($assignments as $assignment) {
            $tableName = $this->getTableName($assignment->entity_type);
            if (! $tableName || ! DB::getSchemaBuilder()->hasColumn($tableName, 'category')) {
                continue;
            }

            DB::table($tableName)
                ->where('id', $assignment->entity_id)
                ->update(['category' => json_encode($value->name)]);
        }
    }

    private function deleteAssignmentsForType(int $typeId): void
    {
        EntityCategoryAssignment::where('category_type_id', $typeId)->delete();
    }

    private function deleteAssignmentsForValue(int $valueId): void
    {
        EntityCategoryAssignment::where('category_value_id', $valueId)->delete();
    }

    private function nullifyEntitiesForValueKeys(string $entityType, array $valueKeys): void
    {
        if (empty($valueKeys)) {
            return;
        }

        $tableName = $this->getTableName($entityType);
        if (! $tableName || ! DB::getSchemaBuilder()->hasColumn($tableName, 'category_key')) {
            return;
        }

        $update = ['category_key' => null];
        if (DB::getSchemaBuilder()->hasColumn($tableName, 'category')) {
            $update['category'] = null;
        }

        DB::table($tableName)
            ->whereIn('category_key', $valueKeys)
            ->update($update);
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

    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:category_types,id'],
            'entity_type' => ['required', 'string'],
        ]);

        // Check if order actually changed
        $currentOrder = CategoryType::where('entity_type', $data['entity_type'])
            ->orderBy('sort_order')
            ->pluck('id')
            ->toArray();

        if ($currentOrder === $data['ids']) {
            return response()->json(['message' => 'Order unchanged']);
        }

        foreach ($data['ids'] as $index => $id) {
            CategoryType::where('id', $id)->update(['sort_order' => $index]);
        }

        $this->clearCache($data['entity_type']);

        return response()->json(['message' => 'Reordered successfully']);
    }
}
