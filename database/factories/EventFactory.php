<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug(),
            'title' => ['en' => $this->faker->sentence(), 'fr' => $this->faker->sentence(), 'ar' => $this->faker->sentence()],
            'location' => ['en' => $this->faker->city(), 'fr' => $this->faker->city(), 'ar' => $this->faker->city()],
            'date' => ['en' => 'Summer 2026', 'fr' => 'Été 2026', 'ar' => 'صيف 2026'],
            'price' => $this->faker->numberBetween(100, 1000),
            'image' => '/images/hero-travel.jpg',
            'description' => ['en' => $this->faker->paragraph(), 'fr' => $this->faker->paragraph(), 'ar' => $this->faker->paragraph()],
            'details' => [
                'about' => ['en' => 'About content', 'fr' => 'À propos', 'ar' => 'حول'],
                'gallery' => ['/images/hero-travel.jpg'],
                'schedule' => [['day' => ['en' => 'Day 1'], 'activity' => ['en' => 'Arrival'], 'details' => ['en' => 'Welcome']]],
            ],
        ];
    }
}
