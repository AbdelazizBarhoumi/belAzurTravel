<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AmenityE2ETest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_hotel_with_amenities()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'name_en' => 'Grand Hotel',
            'name_fr' => 'Grand Hôtel',
            'name_ar' => 'فندق غراند',
            'location_en' => 'Lisbon',
            'location_fr' => 'Lisbonne',
            'location_ar' => 'لشبونة',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxe',
            'category_ar' => 'فاخر',
            'image' => 'hotel.jpg',
            'amenities' => [
                ['name' => ['en' => 'Wifi', 'fr' => 'Wi-Fi', 'ar' => 'واي فاي'], 'icon' => 'wifi'],
            ],
        ];

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/hotels', $payload);

        $response->assertStatus(201);
        
        $hotel = Hotel::where('name->en', 'Grand Hotel')->first();
        $this->assertNotNull($hotel);
        $this->assertCount(1, $hotel->amenities);
        $this->assertEquals('Wifi', $hotel->amenities->first()->name['en']);
    }

    public function test_can_update_hotel_amenities()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $hotel = Hotel::create([
            'slug' => 'test-hotel',
            'code' => 'test',
            'name' => ['en' => 'Test', 'fr' => 'Test', 'ar' => 'Test'],
            'location' => ['en' => 'Test', 'fr' => 'Test', 'ar' => 'Test'],
            'category' => ['en' => 'Test', 'fr' => 'Test', 'ar' => 'Test'],
            'image' => 'test.jpg'
        ]);
        $amenity = Amenity::create(['name' => ['en' => 'Pool', 'fr' => 'Piscine', 'ar' => 'مسبح'], 'icon' => 'pool']);
        $hotel->amenities()->attach($amenity);

        $payload = [
            'amenities' => [
                ['name' => ['en' => 'Gym', 'fr' => 'Salle de sport', 'ar' => 'نادي رياضي'], 'icon' => 'gym'],
            ],
        ];

        $this->actingAs($admin)
            ->putJson("/api/admin/hotels/{$hotel->id}", $payload)
            ->assertOk();

        $hotel->refresh();
        $this->assertCount(1, $hotel->amenities);
        $this->assertEquals('Gym', $hotel->amenities->first()->name['en']);
    }
}
