<?php

namespace App\Services\OsTravel;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\OsTravelHotel;

/**
 * Wraps the OS-TRAVEL booking endpoints into the two-step flows the UI uses.
 *
 * PreBook → Confirm (`BookingCreation` with/without `PreBooking`) for new
 * reservations, Preview → Confirm (`BookingCancellation` with/without
 * `PreCancelled`) for cancellations, plus `BookingList` history. Every call
 * carries the stored provider context (token/source/room ids) captured during
 * the Phase 9 live search — never the client's own credentials.
 */
class OsTravelBookingService
{
    public function __construct(
        private readonly OsTravelClient $client,
        private readonly OsTravelPriceCalculator $calculator,
    ) {}

    /**
     * Build the `HotelBooking` request object from the booking's stored
     * provider context plus the pax supplied by the client.
     *
     * @param  array<string, mixed>  $providerContext  token/source/hotel/rooms from search.
     * @param  array{adults?: list<array<string, mixed>>, children?: list<array<string, mixed>>}  $pax
     * @return array<string, mixed>
     */
    public function buildHotelBooking(array $providerContext, array $pax): array
    {
        $rooms = array_map(function (array $room) use ($pax): array {
            return [
                'Id' => (int) ($room['id'] ?? 0),
                'Boarding' => (int) ($room['boarding_id'] ?? 0),
                'View' => array_map('intval', $room['view_ids'] ?? []),
                'Supplement' => $room['supplements'] ?? [],
                'Pax' => [
                    'Adult' => $pax['adults'] ?? [],
                    'Child' => $pax['children'] ?? [],
                ],
            ];
        }, $providerContext['rooms'] ?? []);

        $booking = [
            'City' => (int) ($providerContext['city'] ?? 0),
            'Hotel' => (int) ($providerContext['hotel'] ?? 0),
            'CheckIn' => $providerContext['check_in'],
            'CheckOut' => $providerContext['check_out'],
            'Source' => $providerContext['source'],
            'Token' => $providerContext['token'],
            'Rooms' => $rooms,
        ];

        if (config('ostravel.booking.send_options')) {
            $booking['Option'] = array_map('intval', $providerContext['options'] ?? []);
        }

        return $booking;
    }

    /**
     * PreBook — verify price and availability without saving. Returns the
     * normalized breakdown (total, currency, rooms) plus the raw provider
     * payload so the caller can persist it.
     *
     * @param  array<string, mixed>  $hotelBooking
     * @return array{total: float, currency: string, breakdown: array<string, mixed>}
     */
    public function preBook(array $hotelBooking): array
    {
        $hotelBooking['PreBooking'] = true;
        $hotelBooking['Comment'] = 'Pre-booking verification';

        $response = $this->client->bookingCreation($hotelBooking);

        return $this->normalizeCreation($response['BookingCreation'] ?? []);
    }

    /**
     * Confirm — actually create the reservation. Idempotent: if the booking
     * already holds a provider id, returns the stored payload unchanged.
     *
     * Persists the provider reference and payload, but never touches the local
     * status: the approval pipeline owns the local lifecycle and records the
     * transition on the audit trail.
     *
     * @param  array<string, mixed>  $hotelBooking
     * @return array{id: string|null, reference: string|null, status: string, breakdown: array<string, mixed>}
     */
    public function confirm(Booking $booking, array $hotelBooking): array
    {
        if ($booking->provider_booking_id) {
            return $this->fromStored($booking);
        }

        $response = $this->client->bookingCreation($hotelBooking);
        $data = $response['BookingCreation'] ?? [];

        $state = $data['State'] ?? 'OnRequest';
        $status = $this->mapStatus($state);

        $booking->update([
            'provider_booking_id' => (string) ($data['Id'] ?? ''),
            'provider_booking_reference' => $data['Voucher']['Num'] ?? null,
            'provider_payload' => $response,
        ]);

        return [
            'id' => (string) ($data['Id'] ?? ''),
            'reference' => $data['Voucher']['Num'] ?? null,
            'status' => $status,
            'breakdown' => $this->normalizeCreation($data)['breakdown'],
        ];
    }

    /**
     * Preview a cancellation — return the fee the user would lose, without
     * cancelling.
     *
     * @param  array<string, mixed>  $bookingContext
     * @return array{total: float, currency: string, fees: list<array<string, mixed>>}
     */
    public function previewCancellation(array $bookingContext): array
    {
        $bookingContext['PreCancelled'] = true;

        $response = $this->client->bookingCancellation($bookingContext);

        return $this->normalizeCancellation($response['BookingCancellation'] ?? []);
    }

    /**
     * Actually cancel a provider booking. Idempotent: cancelling an already
     * cancelled booking is a no-op.
     *
     * @param  array<string, mixed>  $bookingContext
     * @return array{status: string, breakdown: array<string, mixed>}
     */
    public function cancel(Booking $booking, array $bookingContext): array
    {
        if ($booking->status === 'Cancelled') {
            return ['status' => 'Cancelled', 'breakdown' => []];
        }

        $response = $this->client->bookingCancellation($bookingContext);
        $data = $response['BookingCancellation'] ?? [];

        $status = $this->mapCancellationStatus($data['State'] ?? 'Cancelled');

        $booking->update([
            'provider_payload' => $response,
            'status' => $status,
            'cancelled_at' => $status === 'Cancelled' ? now() : null,
        ]);

        return [
            'status' => $status,
            'breakdown' => $this->normalizeCancellation($data),
        ];
    }

    /**
     * Reservation history for a client or admin.
     *
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    public function list(array $filters = [], ?int $page = null): array
    {
        $response = $this->client->bookingList($filters, $page);

        return array_map(
            fn (array $item) => $this->normalizeCreation($item)['breakdown'],
            $response['BookingList'] ?? []
        );
    }

    /**
     * Map an OS-TRAVEL `State` to the app's `Booking.status`.
     */
    public function mapStatus(string $state): string
    {
        return match ($state) {
            'Validated' => 'Confirmed',
            'Cancelled' => 'Cancelled',
            'OnRequest' => 'Pending',
            default => 'Pending',
        };
    }

    /**
     * Map a cancellation `State` to the app's `Booking.status`.
     *
     * `Rejected` (the provider refuses to cancel) must leave a Confirmed
     * booking Confirmed instead of downgrading it, and `OnRequest` keeps the
     * cancellation pending local resolution.
     */
    public function mapCancellationStatus(string $state): string
    {
        return match ($state) {
            'Cancelled' => 'Cancelled',
            'OnRequest' => 'Pending',
            'Rejected' => 'Confirmed',
            default => 'Confirmed',
        };
    }

    /**
     * Resolve a published hotel's provider context (city/hotel ids) from the
     * booking's item slug. Returns null when the hotel is not an OS-TRAVEL
     * published record.
     *
     * @return array<string, mixed>|null
     */
    public function providerContextForBooking(Booking $booking): ?array
    {
        $hotel = Hotel::query()->where('slug', $booking->item_slug)->first();
        if (! $hotel) {
            return null;
        }

        $staged = OsTravelHotel::query()
            ->whereNotNull('hotel_id')
            ->where('hotel_id', $hotel->id)
            ->first();

        if (! $staged) {
            return null;
        }

        return [
            'city' => $staged->city_external_id,
            'hotel' => $staged->external_id,
        ];
    }

    /**
     * Extract the booking's stored provider context (token/source/rooms) plus
     * the live dates. Used to replay the prebook/confirm request.
     *
     * @return array<string, mixed>|null
     */
    public function providerContextFromPayload(Booking $booking): ?array
    {
        $payload = $booking->provider_payload;
        if (! is_array($payload) || empty($payload['request'])) {
            return null;
        }

        return $payload['request'];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{total: float, currency: string, breakdown: array<string, mixed>}
     */
    private function normalizeCreation(array $data): array
    {
        $total = (float) ($data['TotalPrice'] ?? 0);
        $currency = $this->calculator->currency($data['Currency'] ?? 'TND');
        $nights = $this->calculator->nightsBetween(
            isset($data['CheckIn']) ? (string) $data['CheckIn'] : null,
            isset($data['CheckOut']) ? (string) $data['CheckOut'] : null,
        );

        return [
            'total' => $total,
            'currency' => $currency,
            'breakdown' => [
                'id' => $data['Id'] ?? null,
                'state' => $data['State'] ?? null,
                'on_request' => (bool) ($data['OnRequest'] ?? false),
                'check_in' => $data['CheckIn'] ?? null,
                'check_out' => $data['CheckOut'] ?? null,
                'nights' => $nights,
                'total' => $total,
                'currency' => $currency,
                'price_per_night' => $this->calculator->perNight($total, $nights),
                'voucher' => $data['Voucher'] ?? null,
                'cancellation_policy' => $data['CancellationPolicy'] ?? [],
                'rooms' => array_map(
                    function (array $room) use ($nights, $currency): array {
                        $roomTotal = (float) ($room['TotalPrice'] ?? 0);

                        return [
                            'id' => $room['Id'] ?? null,
                            'boarding' => $room['Boarding'] ?? null,
                            'total' => $roomTotal,
                            'currency' => $currency,
                            'nights' => $nights,
                            'price_per_night' => $this->calculator->perNight($roomTotal, $nights),
                        ];
                    },
                    $data['Rooms'] ?? []
                ),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{total: float, currency: string, fees: list<array<string, mixed>>}
     */
    private function normalizeCancellation(array $data): array
    {
        return [
            'total' => (float) ($data['TotalPrice'] ?? 0),
            'currency' => $this->calculator->currency($data['Currency'] ?? 'TND'),
            'fees' => $data['CancellationPolicy'] ?? [],
        ];
    }

    /**
     * @return array{id: string|null, reference: string|null, status: string, breakdown: array<string, mixed>}
     */
    private function fromStored(Booking $booking): array
    {
        $payload = is_array($booking->provider_payload) ? $booking->provider_payload : [];

        return [
            'id' => $booking->provider_booking_id,
            'reference' => $booking->provider_booking_reference,
            'status' => $booking->status,
            'breakdown' => $this->normalizeCreation($payload['BookingCreation'] ?? [])['breakdown'],
        ];
    }
}
