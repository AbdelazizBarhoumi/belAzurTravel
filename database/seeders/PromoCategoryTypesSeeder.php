<?php

namespace Database\Seeders;

use App\Models\CategoryType;
use App\Models\CategoryValue;
use Illuminate\Database\Seeder;

class PromoCategoryTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key' => 'promo_type',
                'label' => ['en' => 'Promo Type', 'fr' => 'Type de promotion', 'ar' => 'نوع العرض'],
                'values' => [
                    ['key' => 'percentage', 'name' => ['en' => 'Percentage Discount', 'fr' => 'Réduction en pourcentage', 'ar' => 'خصم نسبي']],
                    ['key' => 'perk', 'name' => ['en' => 'Perk / Bonus', 'fr' => 'Avantage / Bonus', 'ar' => 'ميزة / إضافة']],
                ],
            ],
        ];

        foreach ($types as $index => $typeData) {
            $type = CategoryType::updateOrCreate(
                ['entity_type' => 'promos', 'key' => $typeData['key']],
                [
                    'label' => $typeData['label'],
                    'sort_order' => $index,
                    'filter_style' => 'pills',
                    'locked' => false,
                ]
            );

            foreach ($typeData['values'] as $valueData) {
                CategoryValue::updateOrCreate(
                    ['category_type_id' => $type->id, 'key' => $valueData['key']],
                    ['name' => $valueData['name']]
                );
            }
        }
    }
}
