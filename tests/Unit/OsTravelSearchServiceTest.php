<?php

namespace Tests\Unit;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelSearchServiceTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
    }

    private function stagedPublishedHotel(int $externalId, string $slug, string $name, int $basePrice): Hotel
    {
        $hotel = Hotel::create([
            'slug' => $slug,
            'code' => "code-{$externalId}",
            'name' => ['en' => $name, 'fr' => $name, 'ar' => $name],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
            'price' => $basePrice,
            'base_price' => $basePrice,
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
            'status' => OsTravelHotel::PUBLISHED,
            'hotel_id' => $hotel->id,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    public function test_search_returns_markup_prices_and_tokens(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        $this->assertCount(2, $results);

        $kelibia = collect($results)->firstWhere('slug', 'cap-bon-kelibia');
        $this->assertSame('Cap Bon Kelibia Beach Hotel & Spa', $kelibia['name']['en']);
        // 927.520 * 1.2 = 1113.024 -> 1113 (TOTAL-stay price, 7 nights).
        $this->assertSame(1113, $kelibia['price']);
        $this->assertSame(1113, $kelibia['price_total']);
        $this->assertSame(7, $kelibia['nights']);
        // 1113 / 7 = 158.999... -> 159.00
        $this->assertSame(159.0, $kelibia['price_per_night']);
        $this->assertSame(927.52, $kelibia['base_price']);
        $this->assertSame('TND', $kelibia['currency']);
        $this->assertSame('eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=', $kelibia['rooms'][0]['token']);
        $this->assertSame('LPD', $kelibia['rooms'][0]['boarding']);
        $this->assertFalse($kelibia['rooms'][0]['stop_reservation']);
        $this->assertCount(3, $kelibia['rooms']);
        // Room-level stay-total semantics.
        $this->assertSame(1113, $kelibia['rooms'][0]['price']);
        $this->assertSame(1113, $kelibia['rooms'][0]['price_total']);
        $this->assertSame(159.0, $kelibia['rooms'][0]['price_per_night']);
        $this->assertSame(7, $kelibia['rooms'][0]['nights']);
        $this->assertSame('TND', $kelibia['rooms'][0]['currency']);
        // Suite: 1200 * 1.2 = 1440.
        $this->assertSame(1440, $kelibia['rooms'][1]['price_total']);
        $this->assertSame(205.71, $kelibia['rooms'][1]['price_per_night']);

        $stopSales = collect($results)->firstWhere('slug', 'stop-sales');
        // All rooms are stop-sales, so the price falls back to the stored value.
        $this->assertSame(800, $stopSales['price']);
        $this->assertTrue($stopSales['rooms'][0]['stop_reservation']);
        $this->assertSame(600, $stopSales['rooms'][0]['price']);
    }

    public function test_search_skips_stopped_rooms_for_min_price(): void
    {
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        $hotel = $results[0];
        // The only room is stop-sales, so min available price is null and the
        // stored price is used as a fallback.
        $this->assertSame(800, $hotel['price']);
        $this->assertSame('TND', $hotel['currency']);
    }

    public function test_search_only_returns_published_matching_slugs(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        $this->assertCount(1, $results);
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
    }

    public function test_search_chunks_hotels_by_two_hundred(): void
    {
        for ($i = 1; $i <= 250; $i++) {
            $this->stagedPublishedHotel($i, "hotel-{$i}", "Hotel {$i}", 100);
        }

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        app(OsTravelSearchService::class)->search(
            collect(range(1, 250))->map(fn ($i) => "hotel-{$i}")->all(),
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        Http::assertSentCount(2);
    }

    public function test_search_results_are_cached(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $service = app(OsTravelSearchService::class);
        $service->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        $this->assertTrue(Cache::has('hotels.search.'.sha1(serialize([
            ['cap-bon-kelibia'],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'rooms' => [],
                'only_available' => true,
                'city_id' => null,
                'stars' => null,
                'category_ids' => [],
                'boarding_ids' => [],
                'price_min' => null,
                'price_max' => null,
                'sort' => 'price_asc',
            ],
        ]))));
    }

    public function test_distinct_searches_do_not_share_cache_entries(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        $first = $this->osTravelFixture('hotel_search');
        $second = $this->osTravelFixture('hotel_search');
        // Distinct price for the September window to prove results don't bleed.
        $second['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['Price'] = '750.000';
        $second['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][1]['Price'] = '900.000';

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::sequence()
                ->push($first)
                ->push($second),
        ]);

        $service = app(OsTravelSearchService::class);

        $sept = $service->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );
        $oct = $service->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-10-01', 'check_out' => '2026-10-08'],
        );

        // Two distinct provider calls happened — no cache bleed between searches.
        Http::assertSentCount(2);

        $this->assertSame(1113, $sept[0]['price']);
        $this->assertSame(900, $oct[0]['price']);
    }

    public function test_refresh_latest_prices_persists_min_available_price(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(1, $result['updated']);
        $this->assertSame(0, $result['omitted']);

        $kelibia = Hotel::where('slug', 'cap-bon-kelibia')->first();
        $this->assertSame(927.52, $kelibia->last_price);
        $this->assertNotNull($kelibia->last_price_at);

        // Stop Sales Hotel's only room is stopped, so no price is written.
        $stopSales = Hotel::where('slug', 'stop-sales')->first();
        $this->assertNull($stopSales->last_price);
    }

    public function test_refresh_keeps_previous_price_when_hotel_omitted(): void
    {
        $hotel = $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $hotel->update(['last_price' => 777.5, 'last_price_at' => now()->subDay()]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        $result = app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(0, $result['updated']);
        $this->assertSame(1, $result['omitted']);

        $hotel->refresh();
        $this->assertSame(777.5, $hotel->last_price);
    }

    public function test_search_flags_availability_and_provider(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        )[0];

        $this->assertTrue($result['available']);
        $this->assertSame('ostravel', $result['provider']);
    }

    public function test_search_filters_by_city(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);
        OsTravelHotel::where('external_id', '999')->update(['city_external_id' => '55']);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'city_id' => '12'],
        );

        $this->assertCount(1, $results);
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
    }

    public function test_search_filters_by_min_stars(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);
        Hotel::where('slug', 'stop-sales')->update(['stars' => 3]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'stars' => 4],
        );

        $this->assertCount(1, $results);
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
    }

    public function test_search_filters_by_boarding(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'boarding_ids' => [5]],
        );

        // Stop Sales Hotel only offers boarding 3 (LS), so it is dropped.
        $this->assertCount(1, $results);
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
        $this->assertCount(1, $results[0]['rooms']);
        $this->assertSame(5, $results[0]['rooms'][0]['boarding_id']);
        // 1080.000 * 1.2 = 1296.
        $this->assertSame(1296, $results[0]['price']);
    }

    public function test_search_filters_by_price_range(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'price_max' => 900],
        );

        // Kelibia's cheapest room is 1113; Stop Sales falls back to 800.
        $this->assertCount(1, $results);
        $this->assertSame('stop-sales', $results[0]['slug']);
    }

    public function test_search_sorts_price_ascending(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'sort' => 'price_asc'],
        );

        $this->assertSame(['stop-sales', 'cap-bon-kelibia'], array_column($results, 'slug'));
    }

    public function test_search_sorts_stars_descending(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'sort' => 'stars_desc'],
        );

        $this->assertSame(['cap-bon-kelibia', 'stop-sales'], array_column($results, 'slug'));
    }

    public function test_search_keeps_unavailable_hotels_when_only_available_is_false(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(777, 'omitted-hotel', 'Omitted Hotel', 600);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'omitted-hotel'],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'only_available' => false,
            ],
        );

        $this->assertCount(2, $results);

        $omitted = collect($results)->firstWhere('slug', 'omitted-hotel');
        $this->assertFalse($omitted['available']);
        $this->assertSame([], $omitted['rooms']);
        // Unavailable hotels fall back to the stored price.
        $this->assertSame(600, $omitted['price']);
        $this->assertSame(600, $omitted['price_total']);

        // Available hotels sort before unavailable ones.
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
        $this->assertTrue($results[0]['available']);
    }
}
