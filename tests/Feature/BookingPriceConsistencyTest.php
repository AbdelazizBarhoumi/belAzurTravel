<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\OsTravelBookingService;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

/**
 * Guarantees that the price shown during a live search (display) equals the
 * marked-up total returned by the provider's PreBook — i.e. what the client
 * is actually charged.
 */
class BookingPriceConsistencyTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
        Cache::flush();
    }

    private function publishedHotel(): Hotel
    {
        $hotel = Hotel::create([
            'slug' => 'cap-bon-kelibia',
            'code' => 'ostravel-178',
            'name' => ['en' => 'Cap Bon Kelibia', 'fr' => 'Cap Bon Kelibia', 'ar' => 'Cap Bon Kelibia'],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
            'category' => ['en' => '4 étoiles', 'fr' => '4 étoiles', 'ar' => '4 étoiles'],
            'price' => 1000,
            'base_price' => 833,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.5,
            'stars' => 4,
            'image' => '/storage/uploads/hotels/test.jpg',
            'tags' => [],
            'details' => [],
            'meta' => [],
        ]);

        OsTravelHotel::create([
            'external_id' => '178',
            'payload' => [],
            'payload_hash' => str_repeat('f', 64),
            'name' => 'Cap Bon Kelibia',
            'city_external_id' => '10',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::APPROVED,
            'hotel_id' => $hotel->id,
            'base_price' => 833,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    public function test_search_total_matches_marked_up_prebook_total(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_confirm')),
        ]);

        $results = app(OsTravelSearchService::class)->search(['cap-bon-kelibia'], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ]);

        $this->assertCount(1, $results);
        $result = $results[0];

        // Cheapest available room: 927.520 * 1.2 = 1113.024 -> 1113 (stay total).
        $this->assertSame(1113, $result['price_total']);
        $this->assertSame(7, $result['nights']);
        $this->assertSame('TND', $result['currency']);

        $cheapest = collect($result['rooms'])
            ->filter(fn ($room) => ! $room['stop_reservation'])
            ->sortBy('price')
            ->first();

        $bookingService = app(OsTravelBookingService::class);
        $hotelBooking = $bookingService->buildHotelBooking([
            'city' => 10,
            'hotel' => 178,
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
            'source' => $result['rooms'][0]['source'],
            'token' => $result['rooms'][0]['token'],
            'rooms' => [[
                'id' => (int) $cheapest['id'],
                'boarding_id' => $cheapest['boarding_id'],
                'view_ids' => $cheapest['view_ids'],
                'supplements' => $cheapest['supplements'],
            ]],
        ], [
            'adults' => [['Civility' => 'Mr', 'Name' => 'John', 'Surname' => 'Doe', 'Holder' => true]],
            'children' => [],
        ]);

        $prebook = $bookingService->preBook($hotelBooking);

        // Same provider raw total (927.520) is used for both; applying the same
        // markup must reproduce the exact total the user was shown at search.
        $this->assertSame(927.52, $prebook['total']);
        $this->assertSame(
            $result['price_total'],
            (int) round($prebook['total'] * (1 + 20 / 100)),
        );
    }

    public function test_room_price_total_and_per_night_are_consistent(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $result = app(OsTravelSearchService::class)->search(['cap-bon-kelibia'], [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ])[0];

        $double = $result['rooms'][0];
        $this->assertSame(7, $double['nights']);
        $this->assertSame(1113, $double['price']);
        $this->assertSame(1113, $double['price_total']);
        // Per-night is derived from the stay total, never shown as the total.
        $this->assertSame(159.0, $double['price_per_night']);
        $this->assertLessThan($double['price_total'], $double['price_per_night']);
    }
}
