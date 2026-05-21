<?php

namespace App\Concerns;

use App\Models\Category;
use Illuminate\Http\Request;

trait HandlesAdminCategories
{
    protected function getCategoryData(Request $request, string $entityType): array
    {
        $categoryKey = $request->input('category') ?? 'beach';

        // Try to find the category in our managed categories
        $category = Category::where('entity_type', $entityType)
            ->where('key', $categoryKey)
            ->first();

        if ($category) {
            return [
                'category_key' => $category->key,
            ];
        }

        // Fallback for legacy/other categories not in the managed list
        return [
            'category_key' => $categoryKey,
        ];
    }
}
