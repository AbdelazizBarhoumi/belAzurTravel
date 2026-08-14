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

    public function test_refresh_staged_prices_persists_min_price_as_base_price(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');
        $this->stagedHotel(999, 'Stop Sales Hotel');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->refreshStagedPrices([], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(1, $result['updated']);
        // Stop Sales Hotel is returned by the provider but has no bookable
        // room, so it has no live price and counts as omitted.
        $this->assertSame(1, $result['omitted']);
        $this->assertSame(['999'], $result['omitted_ids']);
        $this->assertSame([], $result['failed_ids']);

        $kelibia = OsTravelHotel::where('external_id', '178')->first();
        $this->assertSame(928, $kelibia->base_price);
        $this->assertSame('TND', $kelibia->currency);
        $this->assertSame(OsTravelHotel::PRICE_HAS_PRICE, $kelibia->price_status);
        $this->assertNotNull($kelibia->last_price_attempt_at);

        // Stop Sales Hotel's only room is stopped, so no price is written.
        $stopSales = OsTravelHotel::where('external_id', '999')->first();
        $this->assertNull($stopSales->base_price);
        $this->assertSame(OsTravelHotel::PRICE_NO_AVAILABILITY, $stopSales->price_status);
        $this->assertNotNull($stopSales->last_price_attempt_at);
    }

    public function test_refresh_staged_prices_can_target_specific_ids(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');
        $other = $this->stagedHotel(999, 'Stop Sales Hotel');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->refreshStagedPrices([$other->id], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(0, $result['updated']);
        $this->assertNull(OsTravelHotel::where('external_id', '178')->first()->base_price);
        $this->assertNull(OsTravelHotel::where('external_id', '999')->first()->base_price);
    }

    public function test_refresh_staged_prices_skips_published_hotels(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->refreshStagedPrices([], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(0, $result['updated']);
        $this->assertSame(0, $result['omitted']);
        $this->assertSame(1000, OsTravelHotel::where('external_id', '178')->first()->base_price);
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
        // View ids and supplements pass through to power the booking proxy.
        $this->assertSame([1, 3], $kelibia['rooms'][0]['view_ids']);
        $this->assertSame('Insurance', $kelibia['rooms'][0]['supplements'][0]['Name']);
        $this->assertSame(40, $kelibia['rooms'][0]['supplements'][0]['Price']);
        $this->assertSame([2], $kelibia['rooms'][1]['view_ids']);
        $this->assertSame([], $kelibia['rooms'][1]['supplements']);
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

    public function test_refresh_latest_prices_chunks_hotels_by_two_hundred(): void
    {
        for ($i = 1; $i <= 250; $i++) {
            $this->stagedPublishedHotel($i, "hotel-{$i}", "Hotel {$i}", 100);
        }

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        // 250 hotels is two chunks; each chunk is a separate provider call,
        // and every call stays within the 200-per-request cap.
        $requests = Http::recorded();
        $this->assertTrue(count($requests) >= 2);
        foreach ($requests as [$request]) {
            $this->assertLessThanOrEqual(
                200,
                count($request->data()['SearchDetails']['BookingDetails']['Hotels'] ?? [])
            );
        }
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
        // Stop Sales Hotel is returned but has no bookable room, so it has no
        // live price and counts as omitted (its stored price is cleared).
        $this->assertSame(1, $result['omitted']);

        $kelibia = Hotel::where('slug', 'cap-bon-kelibia')->first();
        $this->assertSame(927.52, $kelibia->last_price);
        $this->assertNotNull($kelibia->last_price_at);

        // Stop Sales Hotel's only room is stopped, so no price is written.
        $stopSales = Hotel::where('slug', 'stop-sales')->first();
        $this->assertNull($stopSales->last_price);
    }

    public function test_refresh_clears_previous_price_when_hotel_omitted(): void
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

        // No live per-night price anywhere in the probe horizon: the stale
        // stored price is cleared so browse never shows a non-live value.
        $hotel->refresh();
        $this->assertNull($hotel->last_price);
        $this->assertNull($hotel->last_price_at);
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

    public function test_search_merges_manual_hotels_without_provider_call(): void
    {
        // A provider hotel that will be returned by the fake API.
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        // A purely manual hotel: no OS-TRAVEL staging row.
        Hotel::create([
            'slug' => 'maison-de-la-plage',
            'code' => 'hotel-maison-001',
            'name' => ['en' => 'Maison de la Plage', 'fr' => 'Maison de la Plage', 'ar' => 'منزل الشاطئ'],
            'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.0,
            'stars' => 3,
            'reviews' => 5,
            'image' => 'https://example.com/manual.jpg',
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'maison-de-la-plage'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        $manual = collect($results)->firstWhere('slug', 'maison-de-la-plage');
        $this->assertNotNull($manual);
        $this->assertSame('manual', $manual['provider']);
        $this->assertTrue($manual['available']);
        $this->assertSame([], $manual['rooms']);
        // Stored price is per-night (120); the search shape is a stay total.
        $this->assertSame(7, $manual['nights']);
        $this->assertSame(840, $manual['price']);
        $this->assertSame(840, $manual['price_total']);
        $this->assertSame(120.0, $manual['price_per_night']);
        $this->assertSame(100, $manual['base_price']);
        $this->assertSame('TND', $manual['currency']);
    }

    public function test_search_does_not_call_provider_for_manual_only_slugs(): void
    {
        Hotel::create([
            'slug' => 'maison-de-la-plage',
            'code' => 'hotel-maison-001',
            'name' => ['en' => 'Maison de la Plage', 'fr' => 'Maison de la Plage', 'ar' => 'منزل الشاطئ'],
            'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.0,
            'stars' => 3,
            'reviews' => 5,
            'image' => 'https://example.com/manual.jpg',
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['maison-de-la-plage'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        );

        $this->assertCount(1, $results);
        $this->assertSame('maison-de-la-plage', $results[0]['slug']);
        $this->assertSame('manual', $results[0]['provider']);
        Http::assertNothingSent();
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

    public function test_refresh_latest_prices_probes_forward_to_nearest_available_window(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::sequence()
                ->push(['HotelSearch' => [], 'CountResults' => 0])
                ->push($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        // No availability in the first window, so the refresh probes forward
        // one step (check_in + 7 days) and lands a price there. The price
        // basis is a 1-night window, so the probe CheckOut is +1 night.
        $this->assertSame(1, $result['updated']);
        $this->assertSame(0, $result['omitted']);

        $hotel = Hotel::where('slug', 'cap-bon-kelibia')->first();
        $this->assertSame(927.52, $hotel->last_price);

        Http::assertSent(function ($request) {
            $body = $request->data();

            // The successful probe used the stepped window, not the default.
            return ($body['SearchDetails']['BookingDetails']['CheckIn'] ?? '') === '2026-09-08'
                && ($body['SearchDetails']['BookingDetails']['CheckOut'] ?? '') === '2026-09-09';
        });
    }

    public function test_refresh_staged_prices_probes_forward_to_nearest_available_window(): void
    {
        OsTravelHotel::create([
            'external_id' => '178',
            'payload' => [],
            'payload_hash' => str_repeat('b', 64),
            'name' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PENDING,
            'base_price' => null,
            'last_synced_at' => now(),
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::sequence()
                ->push(['HotelSearch' => [], 'CountResults' => 0])
                ->push($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->refreshStagedPrices();

        $this->assertSame(1, $result['updated']);
        $this->assertSame(0, $result['omitted']);

        $this->assertSame(928, OsTravelHotel::where('external_id', '178')->first()->base_price);
    }

    public function test_refresh_latest_prices_clears_stored_price_when_no_one_night_availability(): void
    {
        $hotel = $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $hotel->update(['last_price' => 777.5, 'last_price_at' => now()->subDay()]);

        // The provider only books a longer stay (e.g. 7 nights) and never
        // returns a 1-night price for this hotel. Since every stored browse
        // price must be a genuine live per-night API value, the stored price
        // is cleared rather than shown as a stale stay-total.
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
        $this->assertNull($hotel->last_price);
        $this->assertNull($hotel->last_price_at);
    }

    public function test_refresh_staged_prices_clears_stored_price_when_no_one_night_availability(): void
    {
        OsTravelHotel::create([
            'external_id' => '178',
            'payload' => [],
            'payload_hash' => str_repeat('b', 64),
            'name' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PENDING,
            'base_price' => 133,
            'last_synced_at' => now(),
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        $result = app(OsTravelSearchService::class)->refreshStagedPrices();

        $this->assertSame(0, $result['updated']);
        $this->assertSame(1, $result['omitted']);
        $this->assertSame(['178'], $result['omitted_ids']);

        $hotel = OsTravelHotel::where('external_id', '178')->first();
        $this->assertNull($hotel->base_price);
        $this->assertSame(OsTravelHotel::PRICE_NO_AVAILABILITY, $hotel->price_status);
        $this->assertNotNull($hotel->last_price_attempt_at);
    }

    public function test_refresh_probe_counts_provider_failure_separately_from_omitted(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response('Service Unavailable', 500),
        ]);

        // A provider error aborts probing (no re-query) and is reported
        // separately from a hotel that simply had no availability.
        $result = app(OsTravelSearchService::class)->refreshLatestPrices([
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(0, $result['updated']);
        $this->assertSame(0, $result['omitted']);
        // The single default-window query was retried per the HTTP client
        // policy (times=3) and then probing aborted — no forward re-query.
        Http::assertSentCount(3);
    }

    public function test_probe_window_reports_prices_omitted_and_failed_for_exact_dates(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');
        $this->stagedHotel(999, 'Stop Sales Hotel');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->probeWindow(['178', '999'], '2026-09-01', '2026-09-08');

        $this->assertArrayHasKey('178', $result['prices']);
        $this->assertSame(927.52, $result['prices']['178']['price']);
        $this->assertSame('TND', $result['prices']['178']['currency']);
        $this->assertSame(['999'], $result['omitted_ids']);
        $this->assertSame([], $result['failed_ids']);
    }

    public function test_probe_window_reports_provider_failure_as_failed(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response('Service Unavailable', 500),
        ]);

        $result = app(OsTravelSearchService::class)->probeWindow(['178'], '2026-09-01', '2026-09-08');

        $this->assertSame([], $result['prices']);
        $this->assertSame([], $result['omitted_ids']);
        $this->assertSame(['178'], $result['failed_ids']);
    }

    public function test_refresh_marks_chunk_provider_error_on_staged_hotel(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response('Service Unavailable', 500),
        ]);

        $result = app(OsTravelSearchService::class)->refreshStagedPrices([], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        // Provider failure is not an omitted hotel: it keeps its value but is
        // flagged so the admin can see why the refresh didn't cover it.
        $this->assertSame(0, $result['updated']);
        $this->assertSame(0, $result['omitted']);
        $this->assertSame(['178'], $result['failed_ids']);

        $hotel = OsTravelHotel::where('external_id', '178')->first();
        $this->assertSame(OsTravelHotel::PRICE_PROVIDER_ERROR, $hotel->price_status);
        $this->assertNotNull($hotel->last_price_attempt_at);
    }

    public function test_refresh_marks_horizon_exceeded_as_omitted_not_failed(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');
        $this->stagedHotel(999, 'Stop Sales Hotel');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response([
                'HotelSearch' => [],
                'CountResults' => 0,
                'ErrorMessage' => ['Code' => 14, 'Description' => 'Données erronées: CheckIn dépasser'],
            ]),
        ]);

        // The provider rejects the window because its CheckIn falls beyond the
        // bookable horizon ("CheckIn dépasser"). Probing further forward is
        // pointless, so the chunk is omitted (no availability), not a provider
        // failure — and it is never retried.
        $result = app(OsTravelSearchService::class)->refreshStagedPrices([], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertSame(0, $result['updated']);
        $this->assertSame(2, $result['omitted']);
        $this->assertSame(['178', '999'], $result['omitted_ids']);
        $this->assertSame([], $result['failed_ids']);

        foreach (['178', '999'] as $externalId) {
            $hotel = OsTravelHotel::where('external_id', $externalId)->first();
            $this->assertSame(OsTravelHotel::PRICE_NO_AVAILABILITY, $hotel->price_status);
            $this->assertNotNull($hotel->last_price_attempt_at);
        }
    }

    public function test_probe_window_marks_horizon_exceeded_as_omitted(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response([
                'HotelSearch' => [],
                'CountResults' => 0,
                'ErrorMessage' => ['Code' => 14, 'Description' => 'Données erronées: CheckIn dépasser'],
            ]),
        ]);

        // A horizon-exceeded window can never yield a live price, so the
        // admin live-check reports the hotel as omitted for those dates rather
        // than surfacing a provider error.
        $result = app(OsTravelSearchService::class)->probeWindow(['178'], '2026-09-01', '2026-09-08');

        $this->assertSame([], $result['prices']);
        $this->assertSame(['178'], $result['omitted_ids']);
        $this->assertSame([], $result['failed_ids']);
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
