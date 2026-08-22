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
            'status' => OsTravelHotel::APPROVED,
            'hotel_id' => $hotel->id,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    private function osTravelEnvelope(int $externalId, array $overrides = []): array
    {
        $envelope = $this->osTravelFixture('hotel_search');
        $envelope['HotelSearch'] = [$envelope['HotelSearch'][0]];
        $envelope['HotelSearch'][0]['Hotel']['Id'] = $externalId;

        if (isset($overrides['stars'])) {
            $envelope['HotelSearch'][0]['Hotel']['Category']['Star'] = $overrides['stars'];
        }
        if (isset($overrides['room_price'])) {
            foreach ($envelope['HotelSearch'][0]['Price']['Boarding'] as &$boarding) {
                foreach ($boarding['Pax'] as &$pax) {
                    foreach ($pax['Rooms'] as &$room) {
                        $room['Price'] = (string) $overrides['room_price'];
                        $room['BasePrice'] = (string) $overrides['room_price'];
                        $room['PriceWithAffiliateMarkup'] = (string) $overrides['room_price'];
                    }
                }
            }
        }

        return $envelope;
    }

    /**
     * Build a single-room provider envelope so bookability (MinStay, StopSales,
     * StopReservation) can be controlled precisely.
     *
     * @param  array<string, mixed>  $room
     */
    private function osTravelSingleRoomEnvelope(int $externalId, float $price, array $room = []): array
    {
        $envelope = $this->osTravelFixture('hotel_search');
        $envelope['HotelSearch'] = [$envelope['HotelSearch'][0]];
        $envelope['HotelSearch'][0]['Hotel']['Id'] = $externalId;
        $envelope['HotelSearch'][0]['Price']['Boarding'] = [$envelope['HotelSearch'][0]['Price']['Boarding'][0]];
        $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'] = [array_merge([
            'Id' => 501,
            'Name' => 'Chambre Double Standard',
            'Price' => (string) $price,
            'BasePrice' => (string) $price,
            'PriceWithAffiliateMarkup' => (string) $price,
            'StopReservation' => false,
            'MinStay' => 1,
            'OnRequest' => false,
            'Quantity' => 2,
            'View' => [1],
            'Supplement' => [],
            'CancellationPolicy' => [],
        ], $room)];

        return $envelope;
    }

    /**
     * Build a two-room provider envelope so the hotel-wide stop-sale
     * intersection can be tested. `$roomA`/`$roomB` carry room overrides.
     *
     * @param  array<string, mixed>  $roomA
     * @param  array<string, mixed>  $roomB
     */
    private function osTravelTwoRoomEnvelope(int $externalId, array $roomA = [], array $roomB = []): array
    {
        $envelope = $this->osTravelFixture('hotel_search');
        $envelope['HotelSearch'] = [$envelope['HotelSearch'][0]];
        $envelope['HotelSearch'][0]['Hotel']['Id'] = $externalId;
        $envelope['HotelSearch'][0]['Price']['Boarding'] = [$envelope['HotelSearch'][0]['Price']['Boarding'][0]];
        $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'] = [
            array_merge([
                'Id' => 501,
                'Name' => 'Chambre Double Standard',
                'Price' => '600.000',
                'BasePrice' => '600.000',
                'PriceWithAffiliateMarkup' => '600.000',
                'StopReservation' => false,
                'MinStay' => 1,
                'OnRequest' => false,
                'Quantity' => 2,
                'View' => [1],
                'Supplement' => [],
                'CancellationPolicy' => [],
            ], $roomA),
            array_merge([
                'Id' => 502,
                'Name' => 'Suite Junior',
                'Price' => '1200.000',
                'BasePrice' => '1200.000',
                'PriceWithAffiliateMarkup' => '1200.000',
                'StopReservation' => false,
                'MinStay' => 1,
                'OnRequest' => false,
                'Quantity' => 1,
                'View' => [2],
                'Supplement' => [],
                'CancellationPolicy' => [],
            ], $roomB),
        ];

        return $envelope;
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

    public function test_search_returns_markup_prices_and_tokens(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'only_available' => false,
            ],
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
        // Provider bookability metadata passes through for the frontend badges.
        $this->assertSame(1, $kelibia['rooms'][0]['min_stay']);
        $this->assertFalse($kelibia['rooms'][0]['on_request']);
        $this->assertSame(3, $kelibia['rooms'][0]['quantity']);
        $this->assertNull($kelibia['rooms'][0]['stop_sales']);
        // Suite: 1200 * 1.2 = 1440.
        $this->assertSame(1440, $kelibia['rooms'][1]['price_total']);
        $this->assertSame(205.71, $kelibia['rooms'][1]['price_per_night']);

        $stopSales = collect($results)->firstWhere('slug', 'stop-sales');
        // All rooms are stop-reserved, so the hotel is unavailable with no live
        // rooms and no live price.
        $this->assertFalse($stopSales['available']);
        $this->assertSame('stop_reservation', $stopSales['unavailable_reason']);
        $this->assertNull($stopSales['first_available_at']);
        $this->assertNull($stopSales['min_nights']);
        $this->assertSame([], $stopSales['rooms']);
        $this->assertNull($stopSales['price']);
        $this->assertNull($stopSales['price_total']);
    }

    public function test_search_surfaces_room_and_hotel_provider_metadata(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        )[0];

        // Hotel-level metadata from the provider envelope.
        $this->assertSame('Early booking', $result['promotion']['title']);
        $this->assertSame('-29% on select stays', $result['promotion']['description']);
        $this->assertSame('29.00', $result['promotion']['rate']);
        $this->assertSame([5], $result['free_child']);
        $this->assertTrue($result['recommended']);
        $this->assertSame("Rénovation totale 2025.\nPlage privée à 100 m.", $result['short_description']);

        // Room-level content fields surface on the cheapest room (boarding LPD).
        // The photo is exposed through an opaque proxy URL — never the provider
        // host, and never a broken image.
        $room = $result['rooms'][0];
        $this->assertMatchesRegularExpression('#^/api/hotels/images/[A-Za-z0-9_-]+$#', $room['image']);
        $this->assertStringNotContainsString('mygo.co', $room['image']);
        $this->assertSame('Chambre Double Standard avec balcon et vue mer partielle.', $room['description']);
        $this->assertSame(['Wifi', 'Climatisation'], $room['features']);
        $this->assertFalse($room['not_refundable']);
        $this->assertSame('2026-08-16', $room['cancellation_deadline']);
        $this->assertSame('29/08/2026', $room['retrocession']);
    }

    public function test_search_normalizes_absent_provider_metadata_to_empty_defaults(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        $envelope = $this->osTravelEnvelope(178);
        // Strip all optional metadata to prove the result stays well-formed.
        unset($envelope['HotelSearch'][0]['Promotion']);
        $envelope['HotelSearch'][0]['FreeChild'] = [];
        $envelope['HotelSearch'][0]['Recommended'] = 0;
        unset($envelope['HotelSearch'][0]['Hotel']['ShortDescription']);
        $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['Photo'] = null;
        unset(
            $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['Description'],
            $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['Icones'],
            $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['NotRefundable'],
            $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['CancellationDeadline'],
            $envelope['HotelSearch'][0]['Price']['Boarding'][0]['Pax'][0]['Rooms'][0]['Retrocession'],
        );

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($envelope),
        ]);

        $result = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08'],
        )[0];

        $this->assertNull($result['promotion']);
        $this->assertSame([], $result['free_child']);
        $this->assertFalse($result['recommended']);
        $this->assertNull($result['short_description']);

        $room = $result['rooms'][0];
        $this->assertNull($room['image']);
        $this->assertSame('', $room['description']);
        $this->assertSame([], $room['features']);
        $this->assertFalse($room['not_refundable']);
        $this->assertNull($room['cancellation_deadline']);
        $this->assertNull($room['retrocession']);
    }

    public function test_search_skips_stopped_rooms_for_min_price(): void
    {
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['stop-sales'],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'only_available' => false,
            ],
        );

        $hotel = $results[0];
        // The only room is stop-reserved, so the hotel is unavailable with no
        // live rooms and no live price.
        $this->assertFalse($hotel['available']);
        $this->assertSame([], $hotel['rooms']);
        $this->assertNull($hotel['price']);
        $this->assertSame('TND', $hotel['currency']);
    }

    public function test_search_parses_french_title_stop_sales_window(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        // The provider returns the stop-sale as a free-text French title
        // covering the searched window; the search must normalize it and report
        // the hotel unavailable with the nearest reopen day.
        $base = $this->osTravelSingleRoomEnvelope(178, 600.0, [
            'StopSales' => 'Stop sales de 01/09/2026 au 08/09/2026 sur hôtel',
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($base),
        ]);

        $result = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia'],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'only_available' => false,
            ],
        )[0];

        $this->assertFalse($result['available']);
        $this->assertSame([], $result['rooms']);
        $this->assertNull($result['price']);
        $this->assertSame('stop_sale', $result['unavailable_reason']);
        // The room reopens the day after the window ends.
        $this->assertSame('2026-09-09', $result['first_available_at']);
    }

    public function test_search_excludes_rooms_whose_minstay_exceeds_searched_nights(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        // Room A fits a 1-night stay; room B needs 3 nights and must not be
        // offered for the 1-night search.
        $base = $this->osTravelTwoRoomEnvelope(178, [], ['MinStay' => 3]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($base),
        ]);

        $result = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-02'],
        )[0];

        $this->assertTrue($result['available']);
        $this->assertCount(1, $result['rooms']);
        $this->assertSame('501', $result['rooms'][0]['id']);
        // 600 * 1.2 = 720 (1-night total).
        $this->assertSame(720, $result['price']);
        $this->assertSame(720.0, $result['price_per_night']);
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
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'price_max' => 900,
                'only_available' => false,
            ],
        );

        // Kelibia's cheapest room is 1113; Stop Sales falls back to 800.
        $this->assertCount(1, $results);
        $this->assertSame('stop-sales', $results[0]['slug']);
    }

    public function test_search_sorts_price_ascending(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(777, 'aqua-resort', 'Aqua Resort', 900);

        $envelope = $this->osTravelEnvelope(178, ['room_price' => 700.0]);
        $envelope['HotelSearch'][] = $this->osTravelEnvelope(777, ['room_price' => 500.0, 'stars' => 3])['HotelSearch'][0];

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($envelope),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'aqua-resort'],
            ['check_in' => '2026-09-01', 'check_out' => '2026-09-08', 'sort' => 'price_asc'],
        );

        // 500 * 1.2 = 600 < 700 * 1.2 = 840.
        $this->assertSame(['aqua-resort', 'cap-bon-kelibia'], array_column($results, 'slug'));
    }

    public function test_search_sorts_stars_descending(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);
        $this->stagedPublishedHotel(999, 'stop-sales', 'Stop Sales Hotel', 800);
        Hotel::where('slug', 'stop-sales')->update(['stars' => 3]);

        $results = app(OsTravelSearchService::class)->search(
            ['cap-bon-kelibia', 'stop-sales'],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'sort' => 'stars_desc',
                'only_available' => false,
            ],
        );

        // Available hotels sort before unavailable ones regardless of stars.
        $this->assertSame(['cap-bon-kelibia', 'stop-sales'], array_column($results, 'slug'));
    }

    public function test_probe_window_reports_prices_unavailable_and_failed_for_exact_dates(): void
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
        // The stop-reserved hotel is reported as unavailable with its reason
        // instead of being silently omitted.
        $this->assertSame('stop_reservation', $result['unavailable']['999']['reason']);
        $this->assertNull($result['unavailable']['999']['first_available_at']);
        $this->assertNull($result['unavailable']['999']['min_nights']);
        $this->assertSame([], $result['omitted_ids']);
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

    public function test_probe_window_does_not_reprice_hotel_when_picked_dates_are_shorter_than_min_stay(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');

        // The admin picks a 1-night window, but the room needs a 3-night stay.
        // The live check must NOT re-probe at the minimum stay: the hotel is
        // reported unavailable for the exact picked window so the admin's full
        // price shows "-" instead of a min-stay total.
        $base = $this->osTravelSingleRoomEnvelope(178, 600.0, ['MinStay' => 3]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($base),
        ]);

        $result = app(OsTravelSearchService::class)->probeWindow(['178'], '2026-09-01', '2026-09-02');

        $this->assertArrayNotHasKey('178', $result['prices']);
        $this->assertSame('min_stay', $result['unavailable']['178']['reason']);
        $this->assertSame(3, $result['unavailable']['178']['min_nights']);
        $this->assertSame([], $result['omitted_ids']);
        $this->assertSame([], $result['failed_ids']);

        // A single base-window call: no min-stay re-probe happens.
        Http::assertSentCount(1);
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

    public function test_search_deduplicates_hotels_echoed_multiple_times_by_provider(): void
    {
        $this->stagedPublishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        $envelope = $this->osTravelSingleRoomEnvelope(178, 800);
        // The provider returns the same hotel Id twice (e.g. once per
        // promotion group). search() must keep only the first occurrence.
        $envelope['HotelSearch'][] = $envelope['HotelSearch'][0];

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($envelope),
        ]);

        $results = app(OsTravelSearchService::class)->search(
            [],
            [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'only_available' => true,
            ],
        );

        $this->assertCount(1, $results);
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
        $this->assertTrue($results[0]['available']);
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
        // Unavailable hotels have no live price.
        $this->assertNull($omitted['price']);
        $this->assertNull($omitted['price_total']);

        // Available hotels sort before unavailable ones.
        $this->assertSame('cap-bon-kelibia', $results[0]['slug']);
        $this->assertTrue($results[0]['available']);
    }
}
