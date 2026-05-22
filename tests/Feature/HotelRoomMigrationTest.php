<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HotelRoomMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_manage_hotel_rooms_via_admin_api()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $hotel = Hotel::create([
            'name' => ['en' => 'Test Hotel', 'fr' => 'Test Hotel', 'ar' => 'Test Hotel'],
            'location' => ['en' => 'Test Location', 'fr' => 'Test Location', 'ar' => 'Test Location'],
            'image' => 'test-image.jpg',
            'slug' => 'test-hotel',
            'code' => 'test-code',
        ]);

        $roomsData = [
            [
                'name' => ['en' => 'Deluxe Room', 'fr' => 'Deluxe Room', 'ar' => 'Deluxe Room'],
                'pricePerNight' => 150.00,
                'capacity' => 2,
                'size' => 30.0,
            ]
        ];

        $response = $this->actingAs($user)->putJson("/api/admin/hotels/{$hotel->id}", [
            'name_en' => 'Test Hotel Updated',
            'rooms' => $roomsData,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hotel_rooms', [
            'hotel_id' => $hotel->id,
            'price_per_night' => 150.00,
            'capacity' => 2,
        ]);
    }

    public function test_can_retrieve_hotel_rooms_via_public_api()
    {
        $hotel = Hotel::create([
            'name' => ['en' => 'Test Hotel', 'fr' => 'Test Hotel', 'ar' => 'Test Hotel'],
            'location' => ['en' => 'Test Location', 'fr' => 'Test Location', 'ar' => 'Test Location'],
            'image' => 'test-image.jpg',
            'slug' => 'test-hotel',
            'code' => 'test-code',
        ]);
        
        $hotel->rooms()->create([
            'name' => ['en' => 'Deluxe Room', 'fr' => 'Deluxe Room', 'ar' => 'Deluxe Room'],
            'price_per_night' => 150,
        ]);

        $response = $this->getJson("/api/hotels/test-hotel");
        $response->assertStatus(200);
        $this->assertEquals(150, (float) $response->json('rooms.0.pricePerNight'));
    }
}
