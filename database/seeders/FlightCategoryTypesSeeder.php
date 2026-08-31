<?php

namespace Database\Seeders;

use App\Models\CategoryType;
use App\Models\CategoryValue;
use Illuminate\Database\Seeder;

class FlightCategoryTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key' => 'trip_type',
                'label' => ['en' => 'Trip Type', 'fr' => 'Type de voyage', 'ar' => 'نوع الرحلة'],
                'values' => [
                    ['key' => 'round-trip', 'name' => ['en' => 'Round Trip', 'fr' => 'Aller-retour', 'ar' => 'ذهاب وعودة']],
                    ['key' => 'one-way', 'name' => ['en' => 'One Way', 'fr' => 'Aller simple', 'ar' => 'ذهاب فقط']],
                    ['key' => 'multi-city', 'name' => ['en' => 'Multi City', 'fr' => 'Multi-ville', 'ar' => 'عدة مدن']],
                ],
            ],
        ];

        foreach ($types as $index => $typeData) {
            $type = CategoryType::updateOrCreate(
                ['entity_type' => 'flights', 'key' => $typeData['key']],
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
