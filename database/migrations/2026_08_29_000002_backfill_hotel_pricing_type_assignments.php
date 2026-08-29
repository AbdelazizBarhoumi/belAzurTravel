<?php

use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use App\Models\Hotel;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $type = CategoryType::where('entity_type', 'hotels')
            ->where('key', 'pricing_type')
            ->first();

        if (! $type) {
            return;
        }

        // Map hotel tags to pricing_type keys.
        $tagToPricingKey = [
            'all-inclusive' => 'all-inclusive',
            'half-board' => 'half-board',
            'demi-pension' => 'half-board',
            'bed-breakfast' => 'bed-breakfast',
            'petit-dejeuner' => 'bed-breakfast',
            'room-only' => 'room-only',
            'logement-simple' => 'room-only',
        ];

        // Fallback: assign based on hotel category if no matching tag.
        $categoryToPricingKey = [
            'luxury' => 'bed-breakfast',
            'resort' => 'all-inclusive',
            'beach' => 'half-board',
            'family' => 'room-only',
        ];

        $values = $type->values()->get()->keyBy('key');

        foreach (Hotel::all() as $hotel) {
            $tags = array_map('strtolower', $hotel->tags ?? []);
            $pricingKey = null;

            // Try to match by tag first.
            foreach ($tags as $tag) {
                if (isset($tagToPricingKey[$tag])) {
                    $pricingKey = $tagToPricingKey[$tag];
                    break;
                }
            }

            // Fallback to category_key.
            if (! $pricingKey && $hotel->category_key) {
                $pricingKey = $categoryToPricingKey[$hotel->category_key] ?? null;
            }

            if (! $pricingKey || ! isset($values[$pricingKey])) {
                continue;
            }

            EntityCategoryAssignment::updateOrCreate(
                [
                    'entity_type' => 'hotels',
                    'entity_id' => $hotel->id,
                    'category_type_id' => $type->id,
                ],
                ['category_value_id' => $values[$pricingKey]->id],
            );
        }
    }

    public function down(): void
    {
        $type = CategoryType::where('entity_type', 'hotels')
            ->where('key', 'pricing_type')
            ->first();

        if ($type) {
            EntityCategoryAssignment::where('entity_type', 'hotels')
                ->where('category_type_id', $type->id)
                ->delete();
        }
    }
};
