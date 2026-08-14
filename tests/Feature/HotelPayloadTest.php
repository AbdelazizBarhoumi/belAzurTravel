<?php

namespace Tests\Feature;

use App\Models\Hotel;
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
}
