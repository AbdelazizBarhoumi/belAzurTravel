<?php

namespace Database\Seeders;

use App\Models\CategoryType;
use App\Models\CategoryValue;
use Illuminate\Database\Seeder;

class TourCategoryTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key' => 'destination',
                'label' => ['en' => 'Destination', 'fr' => 'Destination', 'ar' => 'الوجهة'],
                'values' => [
                    ['key' => 'djerba', 'name' => ['en' => 'Djerba', 'fr' => 'Djerba', 'ar' => 'جربة']],
                    ['key' => 'nord_tunisien', 'name' => ['en' => 'North Tunisia', 'fr' => 'Nord Tunisien', 'ar' => 'شمال تونس']],
                    ['key' => 'sud_tunisien', 'name' => ['en' => 'South Tunisia', 'fr' => 'Sud Tunisien', 'ar' => 'جنوب تونس']],
                    ['key' => 'tunisia', 'name' => ['en' => 'Tunisia', 'fr' => 'Tunisia', 'ar' => 'تونس']],
                ],
            ],
            [
                'key' => 'niveau_physique',
                'label' => ['en' => 'Physical Level', 'fr' => 'Niveau physique', 'ar' => 'المستوى البدني'],
                'values' => [
                    ['key' => 'tranquille', 'name' => ['en' => 'Easy', 'fr' => 'Tranquille', 'ar' => 'هادئ']],
                ],
            ],
            [
                'key' => 'famille',
                'label' => ['en' => 'Family', 'fr' => 'Famille', 'ar' => 'عائلة'],
                'values' => [
                    ['key' => 'famille', 'name' => ['en' => 'Family', 'fr' => 'Famille', 'ar' => 'عائلة']],
                    ['key' => 'djerba_by_vol', 'name' => ['en' => 'DjerbaByVol', 'fr' => 'DjerbaByVol', 'ar' => 'جربة بالطائرة']],
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
                'key' => 'region',
                'label' => ['en' => 'Region', 'fr' => 'Région', 'ar' => 'المنطقة'],
                'values' => [
                    ['key' => 'nord', 'name' => ['en' => 'North', 'fr' => 'Nord', 'ar' => 'شمال']],
                ],
            ],
            [
                'key' => 'voyages_groupe',
                'label' => ['en' => 'Group Tours', 'fr' => 'Voyages en groupe', 'ar' => 'رحلات جماعية'],
                'values' => [
                    ['key' => 'tranquille_groupe', 'name' => ['en' => 'Easy', 'fr' => 'Tranquille', 'ar' => 'هادئ']],
                ],
            ],
        ];

        foreach ($types as $index => $typeData) {
            $type = CategoryType::updateOrCreate(
                ['entity_type' => 'tours', 'key' => $typeData['key']],
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
