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

class HotelSearchPublicFlowTest extends TestCase
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

    private function publishedHotel(int $externalId, string $slug, string $name, int $basePrice): Hotel
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
            'stars' => 4,
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
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PUBLISHED,
            'hotel_id' => $hotel->id,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    public function test_search_requires_valid_dates(): void
    {
        $this->postJson('/api/hotels/search', [])->assertUnprocessable();
        $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
        ])->assertUnprocessable();
        $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-08',
            'check_out' => '2026-09-01',
        ])->assertUnprocessable();
    }

    public function test_search_returns_markup_prices_with_tokens(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'hotel_slugs' => ['cap-bon-kelibia'],
        ])->assertOk();

        $this->assertCount(1, $response->json('data'));
        $item = $response->json('data.0');
        $this->assertSame('cap-bon-kelibia', $item['slug']);
        $this->assertSame(1113, $item['price']);
        $this->assertSame('eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=', $item['rooms'][0]['token']);
        $this->assertCount(3, $item['rooms']);
    }

    public function test_search_ignores_non_published_hotels(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->publishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'hotel_slugs' => ['cap-bon-kelibia'],
        ])->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('cap-bon-kelibia', $response->json('data.0.slug'));
    }

    public function test_search_defaults_to_all_published_hotels(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->publishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ])->assertOk();

        $this->assertCount(2, $response->json('data'));
    }

    public function test_search_does_not_leak_provider_credentials(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ])->assertOk();

        $this->assertStringNotContainsString('XMLBEL', $response->content());
        $this->assertStringNotContainsString('mygo.co', $response->content());
    }
}
