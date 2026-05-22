<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ['en' => 'Test Name', 'fr' => 'Nom de test', 'ar' => 'اسم الاختبار'],
            'role' => ['en' => 'Test Role', 'fr' => 'Rôle de test', 'ar' => 'دور الاختبار'],
            'bio' => ['en' => 'Test Bio', 'fr' => 'Bio de test', 'ar' => 'سيرة الاختبار'],
            'image_path' => '/storage/uploads/seed/test.jpg',
        ];
    }
}
