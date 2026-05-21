<?php

namespace Tests\Feature\Feature;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminHotelManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Assuming admin access is required, though logic depends on the specific auth setup.
        // If no specific guard is required for this controller, this might not be needed.
    }

    public function test_can_manage_hotels_via_admin_api(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // 1. Create a new hotel via Admin API
        $response = $this->postJson('/api/admin/hotels', [
            'name_en' => 'Admin Test Hotel',
            'name_fr' => 'Admin Test Hotel',
            'name_ar' => 'Admin Test Hotel',
            'location_en' => 'Test Location',
            'location_fr' => 'Test Location',
            'location_ar' => 'Test Location',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxe',
            'category_ar' => 'فاخر',
            'price' => 200,
            'image' => 'hotel.jpg',
            'destination_slug' => 'santorini',
        ]);

        $response->assertStatus(201);
        $hotelId = $response->json('data.id');

        // 2. Verify retrieval via Admin index
        $response = $this->getJson('/api/admin/hotels');
        $response->assertStatus(200);
        $response->assertJsonFragment(['destinationSlug' => 'santorini']);

        // 3. Verify retrieval via Admin show
        $response = $this->getJson("/api/admin/hotels/{$hotelId}");
        $response->assertStatus(200);
        $response->assertJsonFragment(['destinationSlug' => 'santorini']);

        // 4. Update the hotel
        $response = $this->putJson("/api/admin/hotels/{$hotelId}", [
            'name_en' => 'Updated Admin Hotel',
            'name_fr' => 'Updated Admin Hotel',
            'name_ar' => 'Updated Admin Hotel',
            'price' => 250,
        ]);
        $response->assertStatus(200);
        $response->assertJsonFragment(['price' => 250, 'name' => 'Updated Admin Hotel']);
    }
}
