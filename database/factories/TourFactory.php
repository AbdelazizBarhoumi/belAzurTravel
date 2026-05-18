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
            'duration' => [
                'en' => fake()->randomElement(['3 days', '5 days', '7 days', '10 days']),
                'fr' => fake()->randomElement(['3 jours', '5 jours', '7 jours', '10 jours']),
                'ar' => fake()->randomElement(['3 أيام', '5 أيام', '7 أيام', '10 أيام']),
            ],
            'duration_days' => fake()->numberBetween(3, 14),
            'duration_nights' => fake()->numberBetween(2, 13),
            'max_group' => fake()->numberBetween(5, 20),
            'price' => fake()->numberBetween(500, 5000),
            'rating' => fake()->randomFloat(1, 3, 5),
            'image' => '/images/hero-travel.jpg',
            'description' => [
                'en' => fake()->paragraph(),
                'fr' => fake()->paragraph(),
                'ar' => fake()->paragraph(),
            ],
            'details' => [
                'itinerary' => [],
                'inclusions' => [],
                'excludes' => [],
            ],
            'itinerary' => [],
            'includes' => [],
            'excludes' => [],
            'images' => [],
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
