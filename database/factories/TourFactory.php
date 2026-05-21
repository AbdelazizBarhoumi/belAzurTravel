<?php

namespace Database\Factories;

use App\Models\Tour;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tour>
 */
class TourFactory extends Factory
{
    protected $model = Tour::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nameEn = fake()->words(3, true);
        $slug = Str::slug($nameEn) . '-' . Str::lower(Str::random(5));

        return [
            'slug' => $slug,
            'name' => [
                'en' => ucfirst($nameEn),
                'fr' => 'Tour ' . fake()->word(),
                'ar' => 'جولة ' . fake()->word(),
            ],
            'location' => [
                'en' => fake()->city(),
                'fr' => fake()->city(),
                'ar' => fake()->city(),
            ],
            'category_key' => 'general',
            'category' => ['en' => 'General'],
            'duration' => [
                'en' => '7 days',
            ],
            'duration_days' => 7,
            'duration_nights' => 6,
            'max_group' => 10,
            'price' => 1000,
            'rating' => 5.0,
            'image' => '/images/hero-travel.jpg',
            'description' => [
                'en' => 'Description',
            ],
            'itinerary' => [],
            'includes' => [],
            'excludes' => [],
            'images' => [],
            'details' => [],
        ];
    }

    /**
     * Create a tour with sample itinerary, includes, and excludes.
     */
    public function withDetails(): static
    {
        return $this->state(fn (array $attributes) => [
            'details' => [
                'itinerary' => [
                    [
                        'day' => 1,
                        'title' => [
                            'en' => 'Arrival',
                            'fr' => 'Arrivée',
                            'ar' => 'الوصول',
                        ],
                        'details' => [
                            'en' => 'Arrive at destination and settle in.',
                            'fr' => 'Arrivée à la destination et installation.',
                            'ar' => 'الوصول إلى الوجهة والاستقرار.',
                        ],
                    ],
                ],
                'inclusions' => [
                    ['en' => 'Accommodation', 'fr' => 'Hébergement', 'ar' => 'الإقامة'],
                    ['en' => 'Meals', 'fr' => 'Repas', 'ar' => 'الوجبات'],
                ],
                'excludes' => [
                    ['en' => 'Travel insurance', 'fr' => 'Assurance voyage', 'ar' => 'تأمين السفر'],
                ],
                'images' => [],
            ],
        ]);
    }
}
