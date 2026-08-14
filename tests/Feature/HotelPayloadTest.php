<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HotelPayloadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeHotel(array $overrides = []): Hotel
    {
        return Hotel::create(array_merge([
            'slug' => 'test-hotel',
            'code' => 'code-test',
            'name' => ['en' => 'Test Hotel', 'fr' => 'Test Hotel', 'ar' => 'Test Hotel'],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
            'price' => 1200,
            'base_price' => 1000,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.5,
            'stars' => 4,
            'reviews' => 10,
            'image' => '/storage/uploads/hotels/test.jpg',
            'tags' => [],
            'details' => [],
            'meta' => [],
        ], $overrides));
    }

    public function test_payload_exposes_last_known_price_and_timestamp(): void
    {
        $hotel = $this->makeHotel([
            'last_price' => 927.52,
            'last_price_at' => now()->subHours(3),
        ]);
        OsTravelHotel::create([
            'external_id' => '178',
            'payload' => [],
            'payload_hash' => str_repeat('a', 64),
            'name' => 'Test Hotel',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PUBLISHED,
            'hotel_id' => $hotel->id,
            'base_price' => 1000,
            'last_synced_at' => now(),
        ]);

        $response = $this->getJson('/api/hotels/test-hotel')->assertOk();

        // The browse payload carries the "last known" price + when it was fetched.
        $this->assertSame(927.52, $response->json('last_price'));
        $this->assertNotNull($response->json('last_price_at'));
        // The displayed price is the last known price marked up, not the raw value.
        $this->assertSame(1113, $response->json('price'));
    }

    public function test_payload_without_last_price_uses_stored_price(): void
    {
        $this->makeHotel();

        $response = $this->getJson('/api/hotels/test-hotel')->assertOk();

        $this->assertNull($response->json('last_price'));
        $this->assertNull($response->json('last_price_at'));
        $this->assertSame(1200, $response->json('price'));
    }

    public function test_provider_hotel_without_live_price_falls_back_to_base_price(): void
    {
        $hotel = $this->makeHotel();
        OsTravelHotel::create([
            'external_id' => '178',
            'payload' => [],
            'payload_hash' => str_repeat('a', 64),
            'name' => 'Test Hotel',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PUBLISHED,
            'hotel_id' => $hotel->id,
            'base_price' => 1000,
            'last_synced_at' => now(),
        ]);

        $response = $this->getJson('/api/hotels/test-hotel')->assertOk();

        // No live per-night price: browse falls back to the approved min price
        // (the same value the admin review shows) rather than hiding it.
        $this->assertNull($response->json('last_price'));
        $this->assertSame(1000, $response->json('base_price'));
        $this->assertSame(1200, $response->json('price'));
    }

    public function test_payload_exposes_source_and_provider(): void
    {
        $this->makeHotel(['source' => 'manual']);

        $response = $this->getJson('/api/hotels/test-hotel')->assertOk();

        // A bare hotel with no published OS-TRAVEL row is a manual hotel.
        $this->assertSame('manual', $response->json('source'));
        $this->assertSame('manual', $response->json('provider'));
    }
}
