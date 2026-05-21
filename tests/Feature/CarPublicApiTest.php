<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CarPublicApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_car_api_returns_structured_payload(): void
    {
        $car = Car::factory()->create([
            'slug' => 'tesla-model-3',
            'name' => ['en' => 'Tesla Model 3'],
            'category' => ['en' => 'Electric'],
            'fuel' => ['en' => 'Electric'],
            'transmission' => ['en' => 'Automatic'],
            'details' => [
                'gallery' => ['/img1.jpg'],
                'features' => [['en' => 'Auto-pilot']],
                'policy' => [['en' => 'Age 21+']],
            ],
        ]);

        $response = $this->getJson('/api/cars/tesla-model-3');

        $response->assertOk()
            ->assertJson([
                'slug' => 'tesla-model-3',
                'name' => ['en' => 'Tesla Model 3'],
                'gallery' => ['/img1.jpg'],
                'features' => [['en' => 'Auto-pilot']],
                'policy' => [['en' => 'Age 21+']],
            ])
            ->assertJsonMissing(['details']); // Ensure details is not leaked as a whole
    }
}
