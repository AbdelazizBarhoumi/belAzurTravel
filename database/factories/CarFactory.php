<?php

namespace Database\Factories;

use App\Models\Car;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Car>
 */
class CarFactory extends Factory
{
    protected $model = Car::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->word();

        return [
            'slug' => $this->faker->slug(),
            'name' => [
                'en' => $name,
                'fr' => $name,
                'ar' => $name,
            ],
            'category' => [
                'en' => $this->faker->word(),
                'fr' => $this->faker->word(),
                'ar' => $this->faker->word(),
            ],
            'price' => $this->faker->numberBetween(50, 200),
            'seats' => $this->faker->randomElement([2, 4, 5, 7]),
            'fuel' => [
                'en' => $this->faker->randomElement(['Petrol', 'Diesel', 'Electric']),
                'fr' => $this->faker->randomElement(['Essence', 'Diesel', 'Électrique']),
                'ar' => $this->faker->randomElement(['بنزين', 'ديزل', 'كهربائي']),
            ],
            'transmission' => [
                'en' => $this->faker->randomElement(['Manual', 'Automatic']),
                'fr' => $this->faker->randomElement(['Manuelle', 'Automatique']),
                'ar' => $this->faker->randomElement(['يدوي', 'أوتوماتيكي']),
            ],
            'image' => '/images/car-default.jpg',
            'details' => [
                'description' => [
                    'en' => $this->faker->sentence(),
                    'fr' => $this->faker->sentence(),
                    'ar' => $this->faker->sentence(),
                ],
                'gallery' => ['/images/car-default.jpg'],
                'features' => [],
                'policy' => [],
            ],
        ];
    }
}
