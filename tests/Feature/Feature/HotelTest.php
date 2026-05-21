<?php

namespace Tests\Feature\Feature;

use App\Models\Hotel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HotelTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_hotel_with_all_fields(): void
    {
        $hotel = Hotel::create([
            'slug' => 'test-hotel',
            'code' => 'TH01',
            'destination_slug' => 'bali',
            'name' => ['en' => 'Test Hotel'],
            'location' => ['en' => 'Location'],
            'category_key' => 'luxury',
            'category' => ['label' => 'Luxury'],
            'price' => 100,
            'rating' => 4.5,
            'stars' => 5,
            'reviews' => 10,
            'image' => 'hotel.jpg',
            'amenities' => ['wifi', 'pool'],
            'tags' => ['beach'],
            'details' => ['description' => 'Great hotel']
        ]);

        $this->assertDatabaseHas('hotels', [
            'slug' => 'test-hotel',
            'category_key' => 'luxury',
        ]);
        $this->assertEquals('luxury', $hotel->category_key);
        $this->assertEquals(['label' => 'Luxury'], $hotel->category);
    }
}
