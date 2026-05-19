<?php

namespace App\Concerns;

use App\Models\Category;
use Illuminate\Http\Request;

trait HandlesAdminCategories
{
    protected function getCategoryData(Request $request, string $entityType): array
    {
        $categoryKey = $request->input('category');
        
        if (!$categoryKey) {
            return [
                'category_key' => null,
                'category' => null,
            ];
        }

        // Try to find the category in our managed categories
        $category = Category::where('entity_type', $entityType)
            ->where('key', $categoryKey)
            ->first();

        if ($category) {
            return [
                'category_key' => $category->key,
                'category' => $category->name,
            ];
        }

        // Fallback for legacy/other categories not in the managed list
        // (though the goal is to move away from this)
        return [
            'category_key' => $categoryKey,
            'category' => ['en' => $categoryKey, 'fr' => $categoryKey, 'ar' => $categoryKey],
        ];
    }
}
