<?php

namespace Database\Seeders;

use App\Models\CategoryType;
use App\Models\CategoryValue;
use Illuminate\Database\Seeder;

class TravelCategoryTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key' => 'destination',
                'label' => ['en' => 'Destination', 'fr' => 'Destination', 'ar' => 'الوجهة'],
                'values' => [
                    ['key' => 'istanbul', 'name' => ['en' => 'Istanbul', 'fr' => 'Istanbul', 'ar' => 'اسطنبول']],
                    ['key' => 'asie', 'name' => ['en' => 'Asia', 'fr' => 'Asie', 'ar' => 'آسيا']],
                    ['key' => 'europe', 'name' => ['en' => 'Europe', 'fr' => 'Europe', 'ar' => 'أوروبا']],
                    ['key' => 'afrique_nord', 'name' => ['en' => 'North Africa', 'fr' => 'Afrique du Nord', 'ar' => 'شمال أفريقيا']],
                ],
            ],
            [
                'key' => 'jeunes',
                'label' => ['en' => 'Young', 'fr' => 'Jeunes', 'ar' => 'شباب'],
                'values' => [
                    ['key' => 'jeune', 'name' => ['en' => 'Young', 'fr' => 'Jeune', 'ar' => 'شباب']],
                ],
            ],
            [
                'key' => 'niveau_physique',
                'label' => ['en' => 'Physical Level', 'fr' => 'Niveau physique', 'ar' => 'المستوى البدني'],
                'values' => [
                    ['key' => 'tranquille', 'name' => ['en' => 'Easy', 'fr' => 'Tranquille', 'ar' => 'هادئ']],
                ],
            ],
        ];

        foreach ($types as $index => $typeData) {
            $type = CategoryType::updateOrCreate(
                ['entity_type' => 'travels', 'key' => $typeData['key']],
                [
                    'label' => $typeData['label'],
                    'sort_order' => $index,
                    'filter_style' => 'checkbox',
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
