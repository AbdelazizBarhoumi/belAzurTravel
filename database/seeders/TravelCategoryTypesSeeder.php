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
                'filter_style' => 'checkbox',
                'locked' => false,
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
                'filter_style' => 'checkbox',
                'locked' => false,
                'values' => [
                    ['key' => 'jeune', 'name' => ['en' => 'Young', 'fr' => 'Jeune', 'ar' => 'شباب']],
                ],
            ],
            [
                'key' => 'niveau_physique',
                'label' => ['en' => 'Physical Level', 'fr' => 'Niveau physique', 'ar' => 'المستوى البدني'],
                'filter_style' => 'checkbox',
                'locked' => false,
                'values' => [
                    ['key' => 'tranquille', 'name' => ['en' => 'Easy', 'fr' => 'Tranquille', 'ar' => 'هادئ']],
                ],
            ],
            [
                'key' => 'trip_type',
                'label' => ['en' => 'Trip Type', 'fr' => 'Type de voyage', 'ar' => 'نوع الرحلة'],
                'filter_style' => 'pills',
                'locked' => true,
                'values' => [
                    ['key' => 'organise', 'name' => ['en' => 'Organized Trip', 'fr' => 'Voyage organisé', 'ar' => 'رحلة منظمة']],
                    ['key' => 'a_la_carte', 'name' => ['en' => 'Custom / À la carte', 'fr' => 'À la carte', 'ar' => 'حسب الطلب']],
                ],
            ],
        ];

        foreach ($types as $index => $typeData) {
            $type = CategoryType::updateOrCreate(
                ['entity_type' => 'travels', 'key' => $typeData['key']],
                [
                    'label' => $typeData['label'],
                    'sort_order' => $index,
                    'filter_style' => $typeData['filter_style'] ?? 'checkbox',
                    'locked' => $typeData['locked'] ?? false,
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
