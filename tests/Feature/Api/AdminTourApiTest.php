<?php

namespace Tests\Feature\Api;

use App\Models\Tour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTourApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_full_crud_lifecycle(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // Store
        $tourData = [
            'name' => 'Test Tour',
            'itinerary' => [['day' => 1, 'activity' => 'Relax']],
            'includes' => ['Food'],
            'excludes' => ['Drink'],
            'images' => ['test.jpg'],
        ];
        $response = $this->postJson('/api/admin/tours', $tourData);
        $response->assertStatus(201);
        $tour = Tour::first();

        // Index
        $this->getJson('/api/admin/tours')->assertStatus(200);

        // Show
        $this->getJson('/api/admin/tours/'.$tour->id)->assertStatus(200);

        // Update
        $this->putJson('/api/admin/tours/'.$tour->id, ['itinerary' => [['day' => 1, 'activity' => 'Explore']]])
            ->assertStatus(200);

        // Destroy
        $this->deleteJson('/api/admin/tours/'.$tour->id)->assertStatus(200);
        $this->assertDatabaseMissing('tours', ['id' => $tour->id]);
    }
}
