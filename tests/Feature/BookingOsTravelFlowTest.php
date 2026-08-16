<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\Payment;
use App\Models\User;
use App\Services\ClictoPayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class BookingOsTravelFlowTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
        Storage::fake('public');
        $this->client = User::factory()->create(['role' => 'client', 'active' => true]);
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
            'payload_hash' => str_repeat('e', 64),
            'name' => 'Cap Bon Kelibia',
            'city_external_id' => '10',
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

    private function hotelBookingPayload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-05',
            'client' => [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '123456789',
            ],
            'amount' => 1113,
            'provider' => [
                'token' => 'eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=',
                'source' => 'OS-TRAVEL-DIRECT',
                'rooms' => [
                    [
                        'id' => 501,
                        'boarding_id' => 4,
                        'view_ids' => [1],
                        'supplements' => [],
                    ],
                ],
                'pax' => [
                    'adults' => [
                        ['Civility' => 'Mr', 'Name' => 'John', 'Surname' => 'Doe', 'Holder' => true],
                    ],
                    'children' => [],
                ],
            ],
        ], $overrides);
    }

    public function test_hotel_booking_prebooks_and_creates_pending_booking(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_prebook')),
        ]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/bookings', $this->hotelBookingPayload())
            ->assertStatus(201);

        $this->assertSame('Pending', $response->json('status'));
        $this->assertSame(1113, $response->json('total_amount'));
        $this->assertSame(927.52, $response->json('provider_prebook.total'));
        $this->assertSame('TND', $response->json('provider_prebook.currency'));
        $this->assertNull($response->json('provider_booking_id'));

        $this->assertDatabaseHas('bookings', [
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'status' => 'Pending',
        ]);
    }

    public function test_hotel_booking_rejects_unknown_or_unpublished_hotel(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_prebook')),
        ]);

        $this->actingAs($this->client)
            ->postJson('/api/bookings', $this->hotelBookingPayload([
                'item_slug' => 'missing-hotel',
            ]))
            ->assertUnprocessable();
    }

    public function test_hotel_booking_surfaces_prebook_failure_as_validation_error(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('error_invalid_credentials'), 200),
        ]);

        $this->actingAs($this->client)
            ->postJson('/api/bookings', $this->hotelBookingPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('provider');
    }

    public function test_hotel_booking_locks_to_the_searched_offer_dates(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_prebook')),
        ]);

        // Dates changed after the search (e.g. by hand) must be rejected.
        $this->actingAs($this->client)
            ->postJson('/api/bookings', $this->hotelBookingPayload([
                'provider' => array_merge($this->hotelBookingPayload()['provider'], [
                    'search' => [
                        'check_in' => '2026-09-01',
                        'check_out' => '2026-09-05',
                    ],
                ]),
                'start_date' => '2026-10-01',
                'end_date' => '2026-10-05',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_date', 'end_date']);

        // Matching dates pass the lock.
        $this->actingAs($this->client)
            ->postJson('/api/bookings', $this->hotelBookingPayload([
                'provider' => array_merge($this->hotelBookingPayload()['provider'], [
                    'search' => [
                        'check_in' => '2026-09-01',
                        'check_out' => '2026-09-05',
                    ],
                ]),
            ]))
            ->assertStatus(201);
    }

    public function test_payment_callback_confirms_provider_booking(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::sequence()
                ->push($this->osTravelFixture('booking_creation_prebook'))
                ->push($this->osTravelFixture('booking_creation_confirm')),
        ]);

        $this->mock(ClictoPayService::class, function ($mock) {
            $mock->shouldReceive('verifyPayment')->once()->andReturn([
                'status' => 'completed',
                'amount' => 1113,
                'orderId' => 'ORDER-1',
                'raw' => [],
            ]);
        });

        $booking = $this->actingAs($this->client)
            ->postJson('/api/bookings', $this->hotelBookingPayload())
            ->json();

        Payment::create([
            'booking_id' => $booking['id'],
            'user_id' => $this->client->id,
            'amount' => 1113,
            'currency' => 'TND',
            'status' => 'pending',
            'clictopay_order_id' => 'ORDER-1',
        ]);

        $this->actingAs($this->client)
            ->getJson('/api/payment/callback?orderId=ORDER-1&booking_id='.$booking['id'])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking['id'],
            'status' => 'Confirmed',
            'provider_booking_id' => '98765',
            'provider_booking_reference' => 'VOUCH-98765',
        ]);
    }

    public function test_client_cancel_confirms_provider_cancellation(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::sequence()
                ->push($this->osTravelFixture('booking_cancellation_preview'))
                ->push($this->osTravelFixture('booking_cancellation_confirm')),
        ]);

        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1113,
            'status' => 'Confirmed',
            'provider_booking_id' => '98765',
            'provider_payload' => [
                'request' => [
                    'Id' => 98765,
                    'Hotel' => 100,
                    'City' => 10,
                ],
            ],
        ]);

        $response = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk();

        $this->assertSame('Cancelled', $response->json('status'));
        $this->assertSame('Cancelled', $response->json('provider_status'));
        $this->assertSame(185.5, $response->json('cancellation_penalty.0.Fees'));
    }

    public function test_client_cancel_without_provider_booking_is_local(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1113,
            'status' => 'Confirmed',
        ]);

        $response = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk();

        $this->assertSame('Cancelled', $response->json('status'));
        Http::assertNothingSent();
    }
}
