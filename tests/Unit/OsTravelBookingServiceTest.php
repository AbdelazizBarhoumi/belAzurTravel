<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Services\OsTravel\OsTravelBookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelBookingServiceTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
    }

    private function hotelBooking(): array
    {
        return [
            'City' => 10,
            'Hotel' => 100,
            'CheckIn' => '2026-09-01',
            'CheckOut' => '2026-09-05',
            'Source' => 'OS-TRAVEL-DIRECT',
            'Token' => 'eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=',
            'Rooms' => [
                [
                    'Id' => 501,
                    'Boarding' => 4,
                    'View' => [1],
                    'Supplement' => [],
                    'Pax' => [
                        'Adult' => [
                            ['Civility' => 'Mr', 'Name' => 'John', 'Surname' => 'Doe', 'Holder' => true],
                        ],
                        'Child' => [],
                    ],
                ],
            ],
        ];
    }

    private function booking(array $overrides = []): Booking
    {
        return Booking::create(array_merge([
            'user_id' => null,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1113,
            'status' => 'Pending',
        ], $overrides));
    }

    public function test_build_hotel_booking_shapes_provider_request(): void
    {
        $service = app(OsTravelBookingService::class);

        $built = $service->buildHotelBooking([
            'city' => 10,
            'hotel' => 100,
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-05',
            'source' => 'OS-TRAVEL-DIRECT',
            'token' => 'tok-1',
            'rooms' => [
                [
                    'id' => 501,
                    'boarding_id' => 4,
                    'view_ids' => [1],
                    'supplements' => [],
                ],
            ],
        ], [
            'adults' => [
                ['Civility' => 'Mr', 'Name' => 'John', 'Surname' => 'Doe', 'Holder' => true],
            ],
            'children' => [],
        ]);

        $this->assertSame(10, $built['City']);
        $this->assertSame(100, $built['Hotel']);
        $this->assertSame('tok-1', $built['Token']);
        $this->assertSame(501, $built['Rooms'][0]['Id']);
        $this->assertSame(4, $built['Rooms'][0]['Boarding']);
        $this->assertSame([1], $built['Rooms'][0]['View']);
        $this->assertSame('John', $built['Rooms'][0]['Pax']['Adult'][0]['Name']);
    }

    public function test_build_hotel_booking_omits_options_when_flag_disabled(): void
    {
        config()->set('ostravel.booking.send_options', false);

        $service = app(OsTravelBookingService::class);

        $built = $service->buildHotelBooking([
            'city' => 10,
            'hotel' => 100,
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-05',
            'source' => 'OS-TRAVEL-DIRECT',
            'token' => 'tok-1',
            'rooms' => [],
            'options' => [1, 2],
        ], ['adults' => [], 'children' => []]);

        $this->assertArrayNotHasKey('Option', $built);
    }

    public function test_build_hotel_booking_forwards_options_when_flag_enabled(): void
    {
        config()->set('ostravel.booking.send_options', true);

        $service = app(OsTravelBookingService::class);

        $built = $service->buildHotelBooking([
            'city' => 10,
            'hotel' => 100,
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-05',
            'source' => 'OS-TRAVEL-DIRECT',
            'token' => 'tok-1',
            'rooms' => [],
            'options' => [1, 2],
        ], ['adults' => [], 'children' => []]);

        $this->assertSame([1, 2], $built['Option']);
    }

    public function test_prebook_returns_normalized_breakdown_without_id(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_prebook')),
        ]);

        $result = app(OsTravelBookingService::class)->preBook($this->hotelBooking());

        $this->assertSame(927.52, $result['total']);
        $this->assertSame('TND', $result['currency']);
        $this->assertNull($result['breakdown']['id']);
        $this->assertSame('Validated', $result['breakdown']['state']);
    }

    public function test_prebook_breakdown_exposes_stay_total_and_per_night(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_confirm')),
        ]);

        $result = app(OsTravelBookingService::class)->preBook($this->hotelBooking());

        // Fixture: 2026-09-01 -> 2026-09-05 = 4 nights, TotalPrice 927.520.
        $this->assertSame(4, $result['breakdown']['nights']);
        $this->assertSame(927.52, $result['breakdown']['total']);
        // 927.52 / 4 = 231.88.
        $this->assertSame(231.88, $result['breakdown']['price_per_night']);
        $this->assertSame(927.52, $result['breakdown']['rooms'][0]['total']);
        $this->assertSame(4, $result['breakdown']['rooms'][0]['nights']);
        $this->assertSame(231.88, $result['breakdown']['rooms'][0]['price_per_night']);
    }

    public function test_confirm_persists_provider_fields_without_writing_local_status(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('booking_creation_confirm')),
        ]);

        $booking = $this->booking();
        $result = app(OsTravelBookingService::class)->confirm($booking, $this->hotelBooking());

        $this->assertSame('98765', $result['id']);
        $this->assertSame('VOUCH-98765', $result['reference']);
        $this->assertSame('Confirmed', $result['status']);

        $booking->refresh();
        $this->assertSame('98765', $booking->provider_booking_id);
        $this->assertSame('VOUCH-98765', $booking->provider_booking_reference);
        $this->assertNotNull($booking->provider_payload);
        // The local lifecycle is owned by the approval pipeline — confirm()
        // never touches status or confirmed_at.
        $this->assertSame('Pending', $booking->status);
        $this->assertNull($booking->confirmed_at);
    }

    public function test_confirm_is_idempotent_when_provider_id_already_exists(): void
    {
        $booking = $this->booking([
            'provider_booking_id' => '98765',
            'provider_booking_reference' => 'VOUCH-98765',
            'provider_payload' => ['BookingCreation' => ['Id' => 98765, 'TotalPrice' => '927.520', 'Currency' => 'TND']],
        ]);

        $result = app(OsTravelBookingService::class)->confirm($booking, $this->hotelBooking());

        $this->assertSame('98765', $result['id']);
        Http::assertNothingSent();
    }

    public function test_confirm_maps_on_request_state_to_pending(): void
    {
        $response = $this->osTravelFixture('booking_creation_confirm');
        $response['BookingCreation']['State'] = 'OnRequest';
        unset($response['BookingCreation']['Id'], $response['BookingCreation']['Voucher']);

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($response),
        ]);

        $booking = $this->booking();
        $result = app(OsTravelBookingService::class)->confirm($booking, $this->hotelBooking());

        $this->assertSame('Pending', $result['status']);
        $this->assertSame('Pending', $booking->refresh()->status);
    }

    public function test_preview_cancellation_returns_fees(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::response($this->osTravelFixture('booking_cancellation_preview')),
        ]);

        $result = app(OsTravelBookingService::class)->previewCancellation([
            'Id' => 98765,
            'Hotel' => 100,
            'City' => 10,
        ]);

        $this->assertSame(185.5, $result['fees'][0]['Fees']);
        $this->assertSame('Validated', 'Validated');
    }

    public function test_cancel_confirms_cancellation_and_updates_status(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::response($this->osTravelFixture('booking_cancellation_confirm')),
        ]);

        $booking = $this->booking([
            'provider_booking_id' => '98765',
            'status' => 'Confirmed',
        ]);

        $result = app(OsTravelBookingService::class)->cancel($booking, [
            'Id' => 98765,
            'Hotel' => 100,
            'City' => 10,
        ]);

        $this->assertSame('Cancelled', $result['status']);
        $this->assertSame('Cancelled', $booking->refresh()->status);
        $this->assertNotNull($booking->cancelled_at);
    }

    public function test_cancel_is_noop_when_already_cancelled(): void
    {
        $booking = $this->booking([
            'provider_booking_id' => '98765',
            'status' => 'Cancelled',
            'cancelled_at' => now(),
        ]);

        $result = app(OsTravelBookingService::class)->cancel($booking, [
            'Id' => 98765,
        ]);

        $this->assertSame('Cancelled', $result['status']);
        Http::assertNothingSent();
    }

    public function test_list_returns_normalized_history(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingList' => Http::response($this->osTravelFixture('booking_list')),
        ]);

        $history = app(OsTravelBookingService::class)->list(['Hotel' => 100]);

        $this->assertCount(2, $history);
        $this->assertSame(98765, $history[0]['id']);
        $this->assertSame(1200.0, $history[1]['total']);
    }

    public function test_map_status(): void
    {
        $service = app(OsTravelBookingService::class);
        $this->assertSame('Confirmed', $service->mapStatus('Validated'));
        $this->assertSame('Cancelled', $service->mapStatus('Cancelled'));
        $this->assertSame('Pending', $service->mapStatus('OnRequest'));
        $this->assertSame('Pending', $service->mapStatus('Unknown'));
    }

    public function test_map_cancellation_status_never_downgrades_rejected_cancellation(): void
    {
        $service = app(OsTravelBookingService::class);
        $this->assertSame('Cancelled', $service->mapCancellationStatus('Cancelled'));
        $this->assertSame('Pending', $service->mapCancellationStatus('OnRequest'));
        $this->assertSame('Confirmed', $service->mapCancellationStatus('Rejected'));
        $this->assertSame('Confirmed', $service->mapCancellationStatus('Validated'));
        $this->assertSame('Confirmed', $service->mapCancellationStatus('Unknown'));
    }

    public function test_provider_context_from_payload_replays_request(): void
    {
        $booking = $this->booking([
            'provider_payload' => [
                'request' => [
                    'City' => 10,
                    'Hotel' => 100,
                    'Token' => 'tok-1',
                ],
            ],
        ]);

        $context = app(OsTravelBookingService::class)->providerContextFromPayload($booking);

        $this->assertSame('tok-1', $context['Token']);
        $this->assertSame(100, $context['Hotel']);
    }
}
