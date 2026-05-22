<?php

namespace Database\Factories;

use App\Models\Promo;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Promo>
 */
class PromoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(Str::random(8)),
            'title' => ['en' => 'Title', 'fr' => 'Titre', 'ar' => 'عنوان'],
            'discount' => ['en' => '10%', 'fr' => '10%', 'ar' => '10%'],
            'description' => ['en' => 'Desc', 'fr' => 'Desc', 'ar' => 'Desc'],
            'expires' => ['en' => '2026-12-31', 'fr' => '2026-12-31', 'ar' => '2026-12-31'],
            'color' => 'blue',
            'details' => [
                'eligibility' => [['en' => 'All', 'fr' => 'Tous', 'ar' => 'الكل']],
                'howToUse' => [['en' => 'Use', 'fr' => 'Utiliser', 'ar' => 'استخدم']],
                'terms' => [['en' => 'None', 'fr' => 'Aucun', 'ar' => 'لا يوجد']],
                'gallery' => [],
            ],
        ];
    }
}
