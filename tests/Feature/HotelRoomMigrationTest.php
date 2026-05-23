<?php

namespace Tests\Feature;

use App\Models\Amenity;
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
            ],
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

    public function test_can_clear_hotel_rooms_via_admin_api_with_structured_payload()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $hotel = Hotel::create([
            'name' => ['en' => 'Test Hotel', 'fr' => 'Test Hotel', 'ar' => 'Test Hotel'],
            'location' => ['en' => 'Test Location', 'fr' => 'Test Location', 'ar' => 'Test Location'],
            'image' => 'test-image.jpg',
            'slug' => 'test-hotel-clear-rooms',
            'code' => 'test-code-clear-rooms',
        ]);

        $room = $hotel->rooms()->create([
            'name_en' => 'Deluxe Room',
            'name_fr' => 'Deluxe Room',
            'name_ar' => 'Deluxe Room',
            'description_en' => 'Large room',
            'description_fr' => 'Large room',
            'description_ar' => 'Large room',
            'price_per_night' => 150,
            'capacity' => 2,
            'size' => 30,
        ]);
        $room->featureItems()->create([
            'label' => 'Ocean view',
            'sort_order' => 0,
        ]);
        $room->imageItems()->create([
            'path' => '/storage/uploads/hotels/rooms/deluxe.jpg',
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($user)->putJson("/api/admin/hotels/{$hotel->id}", [
            'name_en' => 'Test Hotel Updated',
            'name_fr' => 'Test Hotel Updated',
            'name_ar' => 'Test Hotel Updated',
            'location_en' => 'Test Location',
            'location_fr' => 'Test Location',
            'location_ar' => 'Test Location',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxury',
            'category_ar' => 'Luxury',
            'image' => 'test-image.jpg',
            'price' => 200,
            'destination_slug' => 'test-destination',
            'rooms' => [],
            'amenities' => [],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('hotel_rooms', [
            'id' => $room->id,
        ]);
        $this->assertDatabaseMissing('hotel_room_features', [
            'hotel_room_id' => $room->id,
        ]);
        $this->assertDatabaseMissing('hotel_room_images', [
            'hotel_room_id' => $room->id,
        ]);
        $this->assertSame([], $response->json('data.rooms'));
    }

    public function test_can_ignore_blank_hotel_room_drafts_via_admin_api()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $hotel = Hotel::create([
            'name' => ['en' => 'Test Hotel', 'fr' => 'Test Hotel', 'ar' => 'Test Hotel'],
            'location' => ['en' => 'Test Location', 'fr' => 'Test Location', 'ar' => 'Test Location'],
            'image' => 'test-image.jpg',
            'slug' => 'test-hotel-ignore-blank-room',
            'code' => 'test-code-ignore-blank-room',
        ]);

        $response = $this->actingAs($user)->putJson("/api/admin/hotels/{$hotel->id}", [
            'name_en' => 'Test Hotel Updated',
            'name_fr' => 'Test Hotel Updated',
            'name_ar' => 'Test Hotel Updated',
            'location_en' => 'Test Location',
            'location_fr' => 'Test Location',
            'location_ar' => 'Test Location',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxury',
            'category_ar' => 'Luxury',
            'image' => 'test-image.jpg',
            'price' => 200,
            'destination_slug' => 'test-destination',
            'rooms' => [
                [
                    'id' => 'item-blank-room',
                    'name' => ['en' => '', 'fr' => '', 'ar' => ''],
                    'description' => ['en' => '', 'fr' => '', 'ar' => ''],
                    'pricePerNight' => 0,
                    'capacity' => 0,
                    'size' => 0,
                    'features' => [],
                    'images' => [],
                ],
                [
                    'name' => ['en' => 'Suite Room', 'fr' => 'Suite Room', 'ar' => 'Suite Room'],
                    'description' => ['en' => 'Large suite', 'fr' => 'Large suite', 'ar' => 'Large suite'],
                    'pricePerNight' => 180,
                    'capacity' => 2,
                    'size' => 40,
                    'features' => ['Balcony'],
                    'images' => ['/storage/uploads/hotels/rooms/suite.jpg'],
                ],
            ],
            'amenities' => [],
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.rooms'));
        $this->assertDatabaseHas('hotel_rooms', [
            'hotel_id' => $hotel->id,
            'name_en' => 'Suite Room',
            'price_per_night' => 180,
        ]);
    }

    public function test_can_clear_hotel_amenities_via_admin_api_with_structured_payload()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $hotel = Hotel::create([
            'name' => ['en' => 'Test Hotel', 'fr' => 'Test Hotel', 'ar' => 'Test Hotel'],
            'location' => ['en' => 'Test Location', 'fr' => 'Test Location', 'ar' => 'Test Location'],
            'image' => 'test-image.jpg',
            'slug' => 'test-hotel-clear-amenities',
            'code' => 'test-code-clear-amenities',
        ]);

        // Attach an amenity via the pivot to simulate existing data
        $amenity = Amenity::create(['name' => ['en' => 'Wifi', 'fr' => 'Wifi', 'ar' => 'واي فاي'], 'icon' => 'wifi']);
        $hotel->amenities()->attach($amenity->id);

        $response = $this->actingAs($user)->putJson("/api/admin/hotels/{$hotel->id}", [
            'name_en' => 'Test Hotel Updated',
            'name_fr' => 'Test Hotel Updated',
            'name_ar' => 'Test Hotel Updated',
            'location_en' => 'Test Location',
            'location_fr' => 'Test Location',
            'location_ar' => 'Test Location',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxury',
            'category_ar' => 'Luxury',
            'image' => 'test-image.jpg',
            'price' => 200,
            'destination_slug' => 'test-destination',
            'rooms' => [],
            'amenities' => [],
        ]);

        $response->assertStatus(200);
        $this->assertCount(0, $hotel->fresh()->amenities);
        $this->assertSame([], $response->json('data.amenities'));
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
            'name_en' => 'Deluxe Room',
            'name_fr' => 'Deluxe Room',
            'name_ar' => 'Deluxe Room',
            'price_per_night' => 150,
        ]);

        $response = $this->getJson('/api/hotels/test-hotel');
        $response->assertStatus(200);
        $this->assertEquals(150, (float) $response->json('rooms.0.pricePerNight'));
    }
}
