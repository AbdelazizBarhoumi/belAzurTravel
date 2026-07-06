<?php

namespace Database\Seeders;

use App\Models\CategoryType;
use App\Models\CategoryValue;
use Illuminate\Database\Seeder;

class HotelCategoryTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key' => 'tarifs_disponibilites',
                'label' => ['en' => 'Tariffs & Availability', 'fr' => 'Tarifs et disponibilités', 'ar' => 'الأسعار والتوفر'],
                'values' => [
                    ['key' => 'htel_recommande', 'name' => ['en' => 'Recommended hotel', 'fr' => 'Hôtel recommandé', 'ar' => 'فندق موصى به']],
                    ['key' => 'tarifs_promo', 'name' => ['en' => 'Promotional rates', 'fr' => 'Tarifs en promotion', 'ar' => 'أسعار ترويجية']],
                    ['key' => 'enfant_gratuit', 'name' => ['en' => 'Free for children', 'fr' => 'Enfant gratuit', 'ar' => 'أطفال مجانا']],
                    ['key' => 'disponible_seulement', 'name' => ['en' => 'Available only', 'fr' => 'Disponible seulement', 'ar' => 'متاح فقط']],
                    ['key' => 'annulation_gratuite', 'name' => ['en' => 'Free cancellation', 'fr' => 'Annulation gratuite', 'ar' => 'إلغاء مجاني']],
                ],
            ],
            [
                'key' => 'arrangements',
                'label' => ['en' => 'Arrangements', 'fr' => 'Arrangements', 'ar' => 'ترتيبات'],
                'values' => [
                    ['key' => 'logement_simple', 'name' => ['en' => 'Simple accommodation', 'fr' => 'Logement Simple', 'ar' => 'إقامة بسيطة']],
                    ['key' => 'petit_dejeuner', 'name' => ['en' => 'Breakfast', 'fr' => 'Petit Déjeuner', 'ar' => 'فطور']],
                    ['key' => 'demi_pension', 'name' => ['en' => 'Half board', 'fr' => 'Demi Pension', 'ar' => 'نصف إقامة']],
                    ['key' => 'pension_complete', 'name' => ['en' => 'Full board', 'fr' => 'Pension Complète', 'ar' => 'إقامة كاملة']],
                ],
            ],
            [
                'key' => 'categorie',
                'label' => ['en' => 'Category', 'fr' => 'Catégorie', 'ar' => 'فئة'],
                'values' => [
                    ['key' => '3_etoiles', 'name' => ['en' => '3 Stars', 'fr' => '★★★ (3 étoiles)', 'ar' => '3 نجوم']],
                    ['key' => '4_etoiles', 'name' => ['en' => '4 Stars', 'fr' => '★★★★ (4 étoiles)', 'ar' => '4 نجوم']],
                    ['key' => '5_etoiles', 'name' => ['en' => '5 Stars', 'fr' => '★★★★★ (5 étoiles)', 'ar' => '5 نجوم']],
                ],
            ],
            [
                'key' => 'type_chambres',
                'label' => ['en' => 'Room Type', 'fr' => 'Type de chambres', 'ar' => 'نوع الغرفة'],
                'values' => [
                    ['key' => 'chambre_double', 'name' => ['en' => 'Double room', 'fr' => 'Chambre Double', 'ar' => 'غرفة مزدوجة']],
                    ['key' => 'suite', 'name' => ['en' => 'Suite', 'fr' => 'Suite', 'ar' => 'جناح']],
                    ['key' => 'chambre_standard', 'name' => ['en' => 'Standard room', 'fr' => 'Chambre Standard', 'ar' => 'غرفة قياسية']],
                    ['key' => 'suite_junior', 'name' => ['en' => 'Junior suite', 'fr' => 'Suite Junior', 'ar' => 'جناح صغير']],
                ],
            ],
            [
                'key' => 'service',
                'label' => ['en' => 'Service', 'fr' => 'Service', 'ar' => 'خدمة'],
                'values' => [
                    ['key' => 'thalasso_spa', 'name' => ['en' => 'Thalasso & Spa', 'fr' => 'Thalasso & Spa', 'ar' => 'ثالاسو وسبا']],
                    ['key' => 'nature_aventure', 'name' => ['en' => 'Nature and Adventure', 'fr' => 'Nature et Aventure', 'ar' => 'طبيعة ومغامرة']],
                    ['key' => 'famille', 'name' => ['en' => 'Family', 'fr' => 'Famille', 'ar' => 'عائلة']],
                    ['key' => 'affaires', 'name' => ['en' => 'Business', 'fr' => 'Affaires', 'ar' => 'أعمال']],
                    ['key' => 'sport_loisir', 'name' => ['en' => 'Sports & Leisure', 'fr' => 'Sport & Loisir', 'ar' => 'رياضة وترفيه']],
                    ['key' => 'detente', 'name' => ['en' => 'Relaxation', 'fr' => 'Détente', 'ar' => 'استرخاء']],
                ],
            ],
        ];

        foreach ($types as $index => $typeData) {
            $type = CategoryType::updateOrCreate(
                ['entity_type' => 'hotels', 'key' => $typeData['key']],
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
