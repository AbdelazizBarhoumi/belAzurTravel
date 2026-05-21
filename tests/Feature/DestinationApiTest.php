<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DestinationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_destinations_index_returns_numeric_id(): void
    {
        Destination::factory()->create([
            'slug' => 'bali-adventure',
            'name' => ['en' => 'Bali'],
            'country' => ['en' => 'Indonesia'],
            'category_key' => 'beach',
            'image' => 'bali.jpg',
            'description' => ['en' => 'Beautiful Bali'],
        ]);

        $response = $this->getJson('/api/destinations');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            ['id', 'slug', 'name', 'country', 'categoryKey']
        ]);

        $data = $response->json();
        $this->assertIsInt($data[0]['id']);
        $this->assertEquals('bali-adventure', $data[0]['slug']);
    }
}
