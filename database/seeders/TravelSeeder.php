<?php

namespace Database\Seeders;

use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use App\Models\Travel;
use Illuminate\Database\Seeder;

class TravelSeeder extends Seeder
{
    public function run(): void
    {
        // Create the locked "pricing_type" CategoryType for travels
        $pricingType = CategoryType::updateOrCreate(
            [
                'entity_type' => 'travels',
                'key' => 'pricing_type',
            ],
            [
                'label' => ['en' => 'Pricing Type', 'fr' => 'Type de tarif', 'ar' => 'نوع التسعير'],
                'filter_style' => 'radio',
                'sort_order' => 1,
                'locked' => true,
            ]
        );

        // Create the two default values
        CategoryValue::updateOrCreate(
            ['category_type_id' => $pricingType->id, 'key' => 'per-person'],
            ['name' => ['en' => 'Per Person', 'fr' => 'Par personne', 'ar' => 'لكل فرد']]
        );

        CategoryValue::updateOrCreate(
            ['category_type_id' => $pricingType->id, 'key' => 'per-group'],
            ['name' => ['en' => 'Per Group', 'fr' => 'Par groupe', 'ar' => 'للمجموعة']]
        );

        // Seed sample travels (per group)
        $this->seedTravels();
    }

    private function seedTravels(): void
    {
        $perGroupValue = CategoryValue::where('key', 'per-group')->first();

        $travels = [
            [
                'slug' => 'istanbul-cappadocia-discovery',
                'name' => ['en' => 'Istanbul & Cappadocia Discovery', 'fr' => 'Istanbul & Cappadoce Découverte', 'ar' => 'اكتشف إسطنبول و Kapadokya'],
                'description' => ['en' => 'Explore the magic of Istanbul and the fairy chimneys of Cappadocia in one unforgettable journey.', 'fr' => 'Explorez la magie d\'Istanbul et les cheminées des fées de Cappadoce dans un voyage inoubliable.', 'ar' => 'اكتشف سحر إسطنبول والأعمدة السحرية في كابادوكيا في رحلة لا تُنسى.'],
                'location' => ['en' => 'Istanbul & Cappadocia, Turkey', 'fr' => 'Istanbul & Cappadoce, Turquie', 'ar' => 'إسطنبول وكابادوكيا، تركيا'],
                'duration' => ['en' => '7 days / 6 nights', 'fr' => '7 jours / 6 nuits', 'ar' => '7 أيام / 6 ليالٍ'],
                'duration_days' => 7,
                'duration_nights' => 6,
                'max_group' => 30,
                'price' => 1890,
                'rating' => 4.8,
                'image' => 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
                'category_key' => 'per-group',
                'category' => ['en' => 'Per Group', 'fr' => 'Par groupe', 'ar' => 'للمجموعة'],
                'itinerary' => [
                    ['day' => 1, 'title' => ['en' => 'Arrival in Istanbul', 'fr' => 'Arrivée à Istanbul', 'ar' => 'الوصول إلى إسطنبول'], 'details' => ['en' => 'Airport transfer and hotel check-in', 'fr' => 'Transfert aéroport et installation à l\'hôtel', 'ar' => 'الانتقال من المطار والتسجيل في الفندق']],
                    ['day' => 2, 'title' => ['en' => 'Istanbul City Tour', 'fr' => 'Visite d\'Istanbul', 'ar' => 'جولة في إسطنبول'], 'details' => ['en' => 'Hagia Sophia, Blue Mosque, Grand Bazaar', 'fr' => 'Sainte-Sophie, Mosquée Bleue, Grand Bazar', 'ar' => 'آيا صوفيا، الجامع الأزرق، البازار الكبير']],
                ],
                'includes' => [
                    ['en' => 'Round-trip flights', 'fr' => 'Billets aller-retour', 'ar' => 'تذاكر طيران ذهاب وعودة'],
                    ['en' => '6 nights hotel accommodation', 'fr' => 'Hébergement 6 nuits', 'ar' => 'الإقامة 6 ليالٍ'],
                    ['en' => 'Daily breakfast', 'fr' => 'Petits-déjeuners quotidiens', 'ar' => 'فطور يومي'],
                    ['en' => 'Professional guide', 'fr' => 'Guide professionnel', 'ar' => 'مرشد سياحي محترف'],
                ],
                'images' => ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80'],
            ],
            [
                'slug' => 'dubai-abu-dhabi-luxury',
                'name' => ['en' => 'Dubai & Abu Dhabi Luxury', 'fr' => 'Dubaï & Abu Dhabi Luxe', 'ar' => 'دبي وأبو ظبي الفاخرة'],
                'description' => ['en' => 'Experience the ultimate luxury in the UAE with stunning architecture and desert adventures.', 'fr' => 'Vivez le luxe ultime aux Émirats avec une architecture époustouflante et des aventures dans le désert.', 'ar' => 'استمتع بأقصى درجات الفخامة في الإمارات مع عمارة مذهلة ومغامرات صحراوية.'],
                'location' => ['en' => 'Dubai & Abu Dhabi, UAE', 'fr' => 'Dubaï & Abu Dhabi, EAU', 'ar' => 'دبي وأبو ظبي، الإمارات'],
                'duration' => ['en' => '6 days / 5 nights', 'fr' => '6 jours / 5 nuits', 'ar' => '6 أيام / 5 ليالٍ'],
                'duration_days' => 6,
                'duration_nights' => 5,
                'max_group' => 25,
                'price' => 2490,
                'rating' => 4.9,
                'image' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
                'category_key' => 'per-group',
                'category' => ['en' => 'Per Group', 'fr' => 'Par groupe', 'ar' => 'للمجموعة'],
                'images' => ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80'],
            ],
            [
                'slug' => 'antalya-pamukkale-fethiye',
                'name' => ['en' => 'Antalya – Pamukkale – Fethiye', 'fr' => 'Antalya – Pamukkale – Fethiye', 'ar' => 'أنطاليا – باموكالي – فيتحية'],
                'description' => ['en' => 'Discover the turquoise coast of Turkey with ancient ruins and natural hot springs.', 'fr' => 'Découvrez la côte turquoise de Turquie avec des ruines anciennes et des sources thermales naturelles.', 'ar' => 'اكتشف الساحل التركي الفيروزي مع الآثار القديمة والينابيع الساخنة الطبيعية.'],
                'location' => ['en' => 'Antalya, Turkey', 'fr' => 'Antalya, Turquie', 'ar' => 'أنطاليا، تركيا'],
                'duration' => ['en' => '7 days / 6 nights', 'fr' => '7 jours / 6 nuits', 'ar' => '7 أيام / 6 ليالٍ'],
                'duration_days' => 7,
                'duration_nights' => 6,
                'max_group' => 35,
                'price' => 1590,
                'rating' => 4.7,
                'image' => 'https://images.unsplash.com/photo-1596395819908-2c9ea3320d7c?w=800&q=80',
                'category_key' => 'per-group',
                'category' => ['en' => 'Per Group', 'fr' => 'Par groupe', 'ar' => 'للمجموعة'],
                'images' => ['https://images.unsplash.com/photo-1596395819908-2c9ea3320d7c?w=800&q=80'],
            ],
            [
                'slug' => 'kuala-lumpur-bali-eco',
                'name' => ['en' => 'Kuala Lumpur – Bali ECO Pack', 'fr' => 'Kuala Lumpur – Bali pack ECO', 'ar' => 'كوالالمبور – بالي البيئية'],
                'description' => ['en' => 'An eco-friendly journey through Southeast Asia\'s most vibrant destinations.', 'fr' => 'Un voyage écologique à travers les destinations les plus vibrantes d\'Asie du Sud-Est.', 'ar' => 'رحلة صديقة للبيئة عبر أكثر الوجهات حيوية في جنوب شرق آسيا.'],
                'location' => ['en' => 'Malaysia & Indonesia', 'fr' => 'Malaisie & Indonésie', 'ar' => 'ماليزيا وإندونيسيا'],
                'duration' => ['en' => '10 days / 8 nights', 'fr' => '10 jours / 8 nuits', 'ar' => '10 أيام / 8 ليالٍ'],
                'duration_days' => 10,
                'duration_nights' => 8,
                'max_group' => 20,
                'price' => 3290,
                'rating' => 4.6,
                'image' => 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
                'category_key' => 'per-group',
                'category' => ['en' => 'Per Group', 'fr' => 'Par groupe', 'ar' => 'للمجموعة'],
                'images' => ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80'],
            ],
            [
                'slug' => 'omra-2026',
                'name' => ['en' => 'Omra 2026', 'fr' => 'Omra 2026', 'ar' => 'عمرة 2026'],
                'description' => ['en' => 'A spiritual journey to the holy cities of Mecca and Medina.', 'fr' => 'Un voyage spirituel vers les villes saintes de La Mecque et Médine.', 'ar' => 'رحلة روحانية إلى المدينتين المقدستين مكة والمدينة.'],
                'location' => ['en' => 'Mecca & Medina, Saudi Arabia', 'fr' => 'La Mecque & Médine, Arabie Saoudite', 'ar' => 'مكة والمدينة، المملكة العربية السعودية'],
                'duration' => ['en' => '15 days / 14 nights', 'fr' => '15 jours / 14 nuits', 'ar' => '15 يوم / 14 ليلة'],
                'duration_days' => 15,
                'duration_nights' => 14,
                'max_group' => 45,
                'price' => 4150,
                'rating' => 4.9,
                'image' => 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
                'category_key' => 'per-person',
                'category' => ['en' => 'Per Person', 'fr' => 'Par personne', 'ar' => 'لكل فرد'],
                'images' => ['https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80'],
            ],
        ];

        foreach ($travels as $data) {
            $travel = Travel::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );

            // Assign pricing type category
            if ($perGroupValue && isset($data['category_key'])) {
                $pricingType = CategoryType::where('entity_type', 'travels')->where('key', 'pricing_type')->first();
                $value = $pricingType?->values()->where('key', $data['category_key'])->first();

                if ($pricingType && $value) {
                    EntityCategoryAssignment::updateOrCreate(
                        [
                            'entity_type' => 'travels',
                            'entity_id' => $travel->id,
                            'category_type_id' => $pricingType->id,
                        ],
                        ['category_value_id' => $value->id]
                    );
                }
            }
        }
    }
}
