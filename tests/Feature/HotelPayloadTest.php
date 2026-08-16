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

    public function test_provider_linked_payload_has_null_price_and_no_stored_price_keys(): void
    {
        $hotel = $this->makeHotel(['source' => 'ostravel']);
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
            'status' => OsTravelHotel::APPROVED,
            'hotel_id' => $hotel->id,
            'last_synced_at' => now(),
        ]);

        $response = $this->getJson('/api/hotels/test-hotel')->assertOk();

        // Provider-linked hotels carry no stored price: it is always resolved
        // live from HotelSearch for the exact dates, never persisted.
        $this->assertNull($response->json('price'));
        $this->assertNull($response->json('base_price'));
        $this->assertSame('ostravel', $response->json('provider'));
        // The removed stored price/availability keys are never exposed.
        foreach (['last_price', 'last_price_at', 'first_available_at', 'min_nights', 'stop_sale_ranges'] as $key) {
            $this->assertArrayNotHasKey($key, $response->json());
        }
    }

    public function test_manual_hotel_payload_uses_stored_price(): void
    {
        $this->makeHotel();

        $response = $this->getJson('/api/hotels/test-hotel')->assertOk();

        // A manual hotel keeps its stored price.
        $this->assertSame(1200, $response->json('price'));
        $this->assertSame(1000, $response->json('base_price'));
        $this->assertSame('manual', $response->json('provider'));
        // The removed stored price/availability keys are never exposed.
        foreach (['last_price', 'last_price_at', 'first_available_at', 'min_nights', 'stop_sale_ranges'] as $key) {
            $this->assertArrayNotHasKey($key, $response->json());
        }
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
