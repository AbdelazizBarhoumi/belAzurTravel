<?php

namespace Database\Factories;

use App\Models\Destination;
use Illuminate\Database\Eloquent\Factories\Factory;

class DestinationFactory extends Factory
{
    protected $model = Destination::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug(),
            'name' => ['en' => $this->faker->words(2, true)],
            'country' => ['en' => $this->faker->country()],
            'category_key' => 'beach',
            'price' => $this->faker->numberBetween(100, 1000),
            'rating' => $this->faker->randomFloat(1, 1, 5),
            'image' => 'placeholder.jpg',
            'description' => ['en' => $this->faker->paragraph()],
        ];
    }
}
