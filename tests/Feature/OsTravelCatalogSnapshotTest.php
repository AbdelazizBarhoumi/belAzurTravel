<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelCatalogSnapshotTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
        Cache::flush();
    }

    private function stagedPublishedHotel(int $externalId, string $slug, string $name): Hotel
    {
        $hotel = Hotel::create([
            'slug' => $slug,
            'code' => "code-{$externalId}",
            'name' => ['en' => $name, 'fr' => $name, 'ar' => $name],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
            'price' => 1200,
            'base_price' => 1000,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.5,
            'stars' => 4,
            'reviews' => 10,
            'image' => 'https://example.com/hotel.jpg',
        ]);

        OsTravelHotel::create([
            'external_id' => (string) $externalId,
            'payload' => [],
            'payload_hash' => str_repeat('b', 64),
            'name' => $name,
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::APPROVED,
            'hotel_id' => $hotel->id,
            'base_price' => 1000,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    private function stagedHotel(int $id, string $name, string $status = OsTravelHotel::PENDING): OsTravelHotel
    {
        return OsTravelHotel::create([
            'external_id' => (string) $id,
            'payload' => [],
            'payload_hash' => str_repeat('c', 64),
            'name' => $name,
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => $status,
            'last_synced_at' => now(),
        ]);
    }

    public function test_refresh_latest_prices_persists_browse_catalog_on_linked_hotel(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $hotel = Hotel::where('slug', 'cap-bon-kelibia')->first();
        $catalog = $hotel->details['catalog'] ?? null;

        $this->assertNotNull($catalog);

        // Boardings: LPD (4) and DP (5) from the fixture.
        $this->assertSame([
            ['id' => 4, 'code' => 'LPD', 'name' => 'Logement Petit Déjeuner'],
            ['id' => 5, 'code' => 'DP', 'name' => 'Demi Pension'],
        ], $catalog['boardings']);

        // Rooms: two under LPD, one under DP — each carrying content fields.
        $this->assertCount(3, $catalog['rooms']);

        $first = $catalog['rooms'][0];
        $this->assertSame('Chambre Double Standard', $first['name']);
        $this->assertMatchesRegularExpression('#^/api/hotels/images/[A-Za-z0-9_-]+$#', $first['photo']);
        $this->assertStringNotContainsString('mygo.co', $first['photo']);
        $this->assertSame('Chambre Double Standard avec balcon et vue mer partielle.', $first['description']);
        $this->assertSame(['Wifi', 'Climatisation'], $first['features']);
        $this->assertSame(1, $first['min_stay']);
        $this->assertSame(4, $first['boarding_id']);

        // Hotel-level metadata captured alongside.
        $this->assertSame([
            'title' => 'Early booking',
            'description' => '-29% on select stays',
            'rate' => '29.00',
        ], $catalog['promotion']);
        $this->assertSame([5], $catalog['free_child']);
        $this->assertTrue($catalog['recommended']);
    }

    public function test_refresh_latest_prices_clears_catalog_when_hotel_omitted(): void
    {
        $hotel = $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa');
        $details = $hotel->details ?? [];
        $details['catalog'] = ['boardings' => [], 'rooms' => []];
        $hotel->update(['details' => $details]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $hotel->refresh();
        $this->assertArrayNotHasKey('catalog', $hotel->details ?? []);
    }

    public function test_refresh_staged_prices_persists_catalog_on_staging_payload(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        app(OsTravelSearchService::class)->refreshStagedPrices([], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $staged = OsTravelHotel::where('external_id', '178')->first();
        $catalog = $staged->payload['catalog'] ?? null;

        $this->assertNotNull($catalog);
        $this->assertSame(['LPD', 'DP'], array_column($catalog['boardings'], 'code'));
        $this->assertCount(3, $catalog['rooms']);
        $this->assertSame('Early booking', $catalog['promotion']['title']);
        $this->assertSame([5], $catalog['free_child']);
        $this->assertTrue($catalog['recommended']);
    }

    public function test_hotel_payload_exposes_browse_catalog_keys(): void
    {
        $hotel = $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        // The provider detail refresh is skipped (already fetched today) so the
        // payload test never hits the network.
        OsTravelHotel::where('external_id', '178')->update(['detail_fetched_at' => now()]);

        $response = $this->getJson('/api/hotels/cap-bon-kelibia')->assertOk();

        $roomsCatalog = $response->json('rooms_catalog');
        $this->assertIsArray($roomsCatalog);
        $this->assertCount(3, $roomsCatalog);
        $this->assertSame('Chambre Double Standard', $roomsCatalog[0]['name']);
        $this->assertSame(4, $roomsCatalog[0]['boarding_id']);

        $this->assertSame([
            'title' => 'Early booking',
            'description' => '-29% on select stays',
            'rate' => '29.00',
        ], $response->json('promotion'));
        $this->assertSame([5], $response->json('free_child'));
        $this->assertTrue($response->json('recommended'));
    }

    public function test_hotel_payload_defaults_when_no_catalog_stored(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa');
        OsTravelHotel::where('external_id', '178')->update(['detail_fetched_at' => now()]);

        $response = $this->getJson('/api/hotels/cap-bon-kelibia')->assertOk();

        $this->assertSame([], $response->json('rooms_catalog'));
        $this->assertNull($response->json('promotion'));
        $this->assertSame([], $response->json('free_child'));
        $this->assertFalse($response->json('recommended'));
    }
}
