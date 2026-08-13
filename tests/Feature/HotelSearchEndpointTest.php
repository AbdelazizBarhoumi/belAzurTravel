<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class HotelSearchEndpointTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
        Storage::fake('public');
        Http::fake([
            'https://admin.mygo.co/file_manager/*' => Http::response('image-bytes'),
        ]);
        Cache::flush();
    }

    private function publishedHotel(int $externalId, string $slug, string $name, int $basePrice, int $stars = 4, string $cityId = '12'): Hotel
    {
        $hotel = Hotel::create([
            'slug' => $slug,
            'code' => "ostravel-{$externalId}",
            'name' => ['en' => $name, 'fr' => $name, 'ar' => $name],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
            'category' => ['en' => '4 étoiles', 'fr' => '4 étoiles', 'ar' => '4 étoiles'],
            'price' => $basePrice,
            'base_price' => $basePrice,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.5,
            'stars' => $stars,
            'image' => '/storage/uploads/hotels/test.jpg',
            'tags' => [],
            'details' => [
                'city' => ['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'],
                'country' => ['en' => 'Tunisie', 'fr' => 'Tunisie', 'ar' => 'Tunisie'],
            ],
            'meta' => [],
        ]);

        OsTravelHotel::create([
            'external_id' => (string) $externalId,
            'payload' => [],
            'payload_hash' => str_repeat('c', 64),
            'name' => $name,
            'city_external_id' => $cityId,
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => $stars,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PUBLISHED,
            'hotel_id' => $hotel->id,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    public function test_search_rejects_stays_longer_than_30_nights(): void
    {
        $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-10-15',
        ])->assertUnprocessable()->assertJsonValidationErrors(['check_out']);
    }

    public function test_search_validates_filters(): void
    {
        $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'stars' => 6,
            'sort' => 'bogus',
            'per_page' => 200,
            'price_max' => 10,
            'price_min' => 100,
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'stars', 'sort', 'per_page', 'price_max',
        ]);
    }

    public function test_search_returns_paginated_data_and_meta(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->publishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'per_page' => 1,
            'page' => 2,
            'sort' => 'price_asc',
        ])->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('cap-bon-kelibia', $response->json('data.0.slug'));
        $this->assertSame([
            'current_page' => 2,
            'last_page' => 2,
            'total' => 2,
            'per_page' => 1,
        ], $response->json('meta'));
        $this->assertTrue($response->json('data.0.available'));
        $this->assertSame('ostravel', $response->json('data.0.provider'));
    }

    public function test_search_filters_by_city_and_boarding(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->publishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800, stars: 3, cityId: '55');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'city_id' => '12',
            'boarding_ids' => [5],
        ])->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('cap-bon-kelibia', $response->json('data.0.slug'));
        $this->assertSame(1296, $response->json('data.0.price'));
    }

    public function test_search_without_only_available_includes_unavailable_hotels(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->publishedHotel(777, 'omitted-hotel', 'Omitted Hotel', 600);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'only_available' => false,
            'sort' => 'price_asc',
        ])->assertOk();

        $this->assertCount(2, $response->json('data'));
        $omitted = collect($response->json('data'))->firstWhere('slug', 'omitted-hotel');
        $this->assertFalse($omitted['available']);
        $this->assertSame(600, $omitted['price']);
        $this->assertSame([], $omitted['rooms']);
    }
}
