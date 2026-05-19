<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');
        $query = Category::query();

        if ($type) {
            $query->where('entity_type', $type);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'entity_type' => ['required', 'string'],
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['required', 'string'],
        ]);

        $key = Str::slug($data['name']['en']);
        
        // Ensure key uniqueness for this entity type
        $baseKey = $key;
        $counter = 1;
        while (Category::where('entity_type', $data['entity_type'])->where('key', $key)->exists()) {
            $key = $baseKey . '-' . $counter++;
        }

        $category = Category::create([
            'entity_type' => $data['entity_type'],
            'key' => $key,
            'name' => $data['name'],
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string'],
            'name.fr' => ['required', 'string'],
            'name.ar' => ['required', 'string'],
        ]);

        $oldKey = $category->key;
        $category->update(['name' => $data['name']]);

        // If we wanted to update the key we could, but usually keys should be stable.
        // For now, we only update the name labels. Consistency is maintained by the key.

        // Update all entities using this category to reflect the new name if they store it denormalized
        $this->syncEntities($category, $oldKey);

        return response()->json(['data' => $category]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $type = $category->entity_type;
        $key = $category->key;

        // Check if there are entities using this category
        $count = $this->getEntityCount($type, $key);

        if (request()->query('force') !== 'true' && $count > 0) {
            return response()->json([
                'message' => "This category is assigned to {$count} items. Deleting it will set their category to null.",
                'count' => $count,
                'requires_confirmation' => true
            ], 409);
        }

        // Nullify categories in entities
        $this->nullifyEntities($type, $key);

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    private function getEntityCount(string $type, string $key): int
    {
        $table = $this->getTableName($type);
        if (!$table) return 0;

        return DB::table($table)->where('category_key', $key)->count();
    }

    private function nullifyEntities(string $type, string $key): void
    {
        $table = $this->getTableName($type);
        if (!$table) return;

        DB::table($table)->where('category_key', $key)->update([
            'category_key' => null,
            'category' => null
        ]);
    }

    private function syncEntities(Category $category, string $oldKey): void
    {
        $table = $this->getTableName($category->entity_type);
        if (!$table) return;

        DB::table($table)->where('category_key', $oldKey)->update([
            'category' => json_encode($category->name)
        ]);
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
