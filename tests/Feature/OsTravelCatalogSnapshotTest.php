<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    public function test_hotel_payload_exposes_browse_catalog_keys(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa');

        // The provider detail refresh is skipped (already fetched today) so the
        // payload test never hits the network.
        OsTravelHotel::where('external_id', '178')->update(['detail_fetched_at' => now()]);

        $response = $this->getJson('/api/hotels/cap-bon-kelibia')->assertOk();

        // Provider hotels carry no stored price: the public payload always
        // exposes null — the live price is computed from HotelSearch at search
        // time — regardless of any legacy value left on the `hotels` row.
        $this->assertNull($response->json('price'));
        $this->assertNull($response->json('base_price'));
        $this->assertSame('ostravel', $response->json('provider'));
        $this->assertSame('20.00', $response->json('markup_percentage'));
        $this->assertSame('TND', $response->json('currency'));

        // The removed stored-price / availability columns no longer leak into
        // the browse payload.
        foreach ([
            'last_price',
            'last_price_at',
            'first_available_at',
            'min_nights',
            'stop_sale_ranges',
            'rooms_catalog',
            'promotion',
            'free_child',
            'recommended',
        ] as $key) {
            $this->assertArrayNotHasKey($key, $response->json());
        }
    }

    public function test_hotel_payload_defaults_when_no_catalog_stored(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa');
        OsTravelHotel::where('external_id', '178')->update(['detail_fetched_at' => now()]);

        $response = $this->getJson('/api/hotels/cap-bon-kelibia')->assertOk();

        $this->assertSame('cap-bon-kelibia', $response->json('slug'));
        $this->assertSame('ostravel', $response->json('provider'));
        $this->assertNull($response->json('price'));
        $this->assertNull($response->json('base_price'));
        $this->assertSame([], $response->json('rooms'));
    }
}
