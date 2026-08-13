<?php

namespace App\Services\OsTravel;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Proxies provider `HotelSearch` calls for the public search endpoint.
 *
 * Resolves the visible set of published hotels to provider ids, chunks them
 * into groups of ≤ 200, applies the per-hotel markup, and normalizes results
 * into the public `HotelController::payload()` shape plus live `rooms[]`.
 * Live prices are NEVER persisted back to `hotels.base_price`.
 */
class OsTravelSearchService
{
    public const MAX_HOTELS_PER_REQUEST = 200;

    public function __construct(
        private readonly OsTravelClient $client,
        private readonly OsTravelPriceCalculator $calculator,
    ) {}

    /**
     * @param  list<string>  $hotelSlugs  Slugs of the hotels to price (the visible set).
     *                                    Empty = all published OS-TRAVEL hotels.
     * @param  array{rooms?: list<array{adults?: int, children?: list<int>}>}  $options
     * @return list<array<string, mixed>>
     */
    public function search(array $hotelSlugs, array $options = []): array
    {
        $searchDetails = $this->searchDetails($options);
        $cacheKey = 'hotels.search.'.sha1(serialize([$hotelSlugs, $searchDetails, $options['only_available'] ?? true]));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($hotelSlugs, $options, $searchDetails) {
            $query = OsTravelHotel::query()
                ->where('status', OsTravelHotel::PUBLISHED)
                ->with('hotel');

            if ($hotelSlugs !== []) {
                $query->whereHas('hotel', fn ($q) => $q->whereIn('slug', $hotelSlugs));
            }

            $staged = $query->get()->keyBy('external_id');

            if ($staged->isEmpty()) {
                return [];
            }

            $results = [];

            $nights = $this->calculator->nightsBetween(
                $searchDetails['check_in'],
                $searchDetails['check_out'],
            );

            foreach (array_chunk($staged->keys()->all(), self::MAX_HOTELS_PER_REQUEST) as $chunk) {
                try {
                    $envelope = $this->client->hotelSearch([
                        'BookingDetails' => [
                            'CheckIn' => $searchDetails['check_in'],
                            'CheckOut' => $searchDetails['check_out'],
                            'Hotels' => array_map('intval', $chunk),
                        ],
                        'Filters' => [
                            'OnlyAvailable' => (bool) ($options['only_available'] ?? true),
                        ],
                        'Rooms' => $this->providerRooms($options['rooms'] ?? []),
                    ]);
                } catch (Throwable $e) {
                    Log::warning('OS-TRAVEL HotelSearch chunk failed.', [
                        'hotels' => $chunk,
                        'error' => $e->getMessage(),
                    ]);

                    continue;
                }

                foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                    $externalId = (string) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? '');
                    $item = $staged->get($externalId);
                    if ($item === null || $item->hotel === null) {
                        continue;
                    }

                    $results[] = $this->normalize($item->hotel, $providerHotel, $nights);
                }
            }

            return $results;
        });
    }

    /**
     * Best-known price used by the browse-mode scheduler. Runs a single
     * batched search for all published hotels and persists `last_price` /
     * `last_price_at` on `hotels`. Hotels omitted by the provider (no
     * availability that window) keep their previous value.
     *
     * @param  array<string, mixed>  $options  Same options as {@see search()}.
     * @return array{updated: int, omitted: int}
     */
    public function refreshLatestPrices(array $options = []): array
    {
        $published = OsTravelHotel::query()
            ->where('status', OsTravelHotel::PUBLISHED)
            ->whereNotNull('hotel_id')
            ->with('hotel')
            ->get()
            ->keyBy('external_id');

        if ($published->isEmpty()) {
            return ['updated' => 0, 'omitted' => 0];
        }

        $options['only_available'] ??= true;
        $searchDetails = $this->searchDetails($options);

        $updated = 0;
        $omitted = 0;

        foreach (array_chunk($published->keys()->all(), self::MAX_HOTELS_PER_REQUEST) as $chunk) {
            try {
                $envelope = $this->client->hotelSearch([
                    'BookingDetails' => [
                        'CheckIn' => $searchDetails['check_in'],
                        'CheckOut' => $searchDetails['check_out'],
                        'Hotels' => array_map('intval', $chunk),
                    ],
                    'Filters' => [
                        'OnlyAvailable' => (bool) $options['only_available'],
                    ],
                    'Rooms' => $this->providerRooms($options['rooms'] ?? []),
                ]);
            } catch (Throwable $e) {
                Log::warning('OS-TRAVEL latest-price refresh chunk failed.', [
                    'hotels' => $chunk,
                    'error' => $e->getMessage(),
                ]);

                continue;
            }

            $seen = [];

            foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                $externalId = (string) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? '');
                $item = $published->get($externalId);
                if ($item === null || $item->hotel === null) {
                    continue;
                }
                $seen[$externalId] = true;

                $minPrice = $this->minRoomPrice($providerHotel);
                if ($minPrice === null) {
                    continue;
                }

                $item->hotel->update([
                    'last_price' => $minPrice,
                    'last_price_at' => now(),
                ]);
                $updated++;
            }

            $omitted += count(array_diff($chunk, array_keys($seen)));
        }

        return ['updated' => $updated, 'omitted' => $omitted];
    }

    /**
     * @return array{check_in: string, check_out: string, rooms: list<array{adults: int, children: list<int>}>}
     */
    private function searchDetails(array $options): array
    {
        $checkIn = $options['check_in'] ?? Carbon::today()->addDay()->toDateString();
        $checkOut = $options['check_out'] ?? Carbon::parse($checkIn)->addDays(7)->toDateString();

        return [
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'rooms' => $options['rooms'] ?? [],
        ];
    }

    /**
     * @param  list<array{adults?: int, children?: list<int>}>  $rooms
     * @return list<array{Adult: int, Child: list<int>}>
     */
    private function providerRooms(array $rooms): array
    {
        if ($rooms === []) {
            return [['Adult' => 2, 'Child' => []]];
        }

        return array_map(
            fn (array $room) => [
                'Adult' => (int) ($room['adults'] ?? 2),
                'Child' => array_map('intval', $room['children'] ?? []),
            ],
            $rooms
        );
    }

    /**
     * The provider returns a single offer per hotel inside `HotelSearch`.
     * A hotel can be available for several boardings and pax configurations;
     * this flattens `Price.Boarding[].Pax[].Rooms[]` into bookable room offers
     * (a room + the boarding/pax it was quoted for).
     *
     * @param  array<string, mixed>  $providerHotel
     * @return list<array<string, mixed>>
     */
    private function roomOffers(array $providerHotel): array
    {
        $offers = [];

        foreach ($providerHotel['Price']['Boarding'] ?? [] as $boarding) {
            $boardingId = isset($boarding['Id']) ? (int) $boarding['Id'] : null;
            $boardingCode = $boarding['Code'] ?? null;
            $boardingName = $boarding['Name'] ?? null;

            foreach ($boarding['Pax'] ?? [] as $pax) {
                $adults = (int) ($pax['Adult'] ?? 0);

                foreach ($pax['Rooms'] ?? [] as $room) {
                    $offers[] = [
                        'id' => (string) ($room['Id'] ?? ''),
                        'name' => $room['Name'] ?? '',
                        'boarding_id' => $boardingId,
                        'boarding' => $boardingCode,
                        'boarding_name' => $boardingName,
                        'adults' => $adults,
                        'price' => (float) ($room['Price'] ?? $room['BasePrice'] ?? 0),
                        'stop_reservation' => (bool) ($room['StopReservation'] ?? false),
                        'cancellation_policy' => $room['CancellationPolicy'] ?? [],
                        'view' => '',
                        'view_ids' => [],
                        'supplements' => [],
                    ];
                }
            }
        }

        return $offers;
    }

    /**
     * @param  array<string, mixed>  $providerHotel
     * @return array<string, mixed>
     */
    private function normalize(Hotel $hotel, array $providerHotel, int $nights): array
    {
        $markup = (float) $hotel->markup_percentage;
        $currency = $this->calculator->currency($providerHotel['Currency'] ?? $hotel->currency);

        $rooms = [];
        foreach ($this->roomOffers($providerHotel) as $offer) {
            $basePrice = $offer['price'];

            $rooms[] = [
                'id' => $offer['id'],
                'name' => $offer['name'],
                'boarding' => $offer['boarding'],
                'boarding_name' => $offer['boarding_name'],
                'boarding_id' => $offer['boarding_id'],
                'adults' => $offer['adults'],
                'view' => $offer['view'],
                'view_ids' => $offer['view_ids'],
                // Provider prices are TOTAL-stay per room; the public price is
                // that total plus markup, and the per-night figure is derived.
                'price' => $this->calculator->applyMarkup($basePrice, $markup),
                'price_total' => $this->calculator->applyMarkup($basePrice, $markup),
                'price_per_night' => $this->calculator->perNight($this->calculator->applyMarkup($basePrice, $markup), $nights),
                'base_price' => $basePrice,
                'currency' => $currency,
                'nights' => $nights,
                'token' => $providerHotel['Token'] ?? null,
                'source' => $providerHotel['Source'] ?? null,
                'stop_reservation' => $offer['stop_reservation'],
                'cancellation_policy' => $this->cancellationPolicy($offer['cancellation_policy']),
                'supplements' => $offer['supplements'],
            ];
        }

        $minRoom = null;
        foreach ($rooms as $room) {
            if ($room['stop_reservation']) {
                continue;
            }
            if ($minRoom === null || $room['price'] < $minRoom['price']) {
                $minRoom = $room;
            }
        }

        return [
            'id' => $hotel->slug,
            'slug' => $hotel->slug,
            'name' => $hotel->name,
            'location' => $hotel->location,
            'category_key' => $hotel->category_key,
            'category' => $hotel->category,
            'stars' => $hotel->stars,
            'rating' => $hotel->rating,
            'reviews' => $hotel->reviews,
            'image' => $hotel->image,
            // Stay-total semantics: `price` is the cheapest available room's
            // total for the whole stay (marked up); fall back to stored when
            // every room is stopped.
            'price' => $minRoom['price'] ?? $hotel->price,
            'price_total' => $minRoom['price_total'] ?? $hotel->price,
            'price_per_night' => $minRoom['price_per_night'] ?? $this->calculator->perNight($hotel->price, $nights),
            'base_price' => $minRoom['base_price'] ?? $hotel->base_price,
            'markup_percentage' => $hotel->markup_percentage,
            'currency' => $minRoom['currency'] ?? $currency,
            'nights' => $nights,
            'rooms' => $rooms,
        ];
    }

    /**
     * @param  array<string, mixed>  $providerHotel
     */
    private function minRoomPrice(array $providerHotel): ?float
    {
        $prices = [];
        foreach ($this->roomOffers($providerHotel) as $offer) {
            if ($offer['stop_reservation']) {
                continue;
            }
            $prices[] = $offer['price'];
        }

        return $prices === [] ? null : (float) min($prices);
    }

    /**
     * @param  array<int, mixed>  $policy
     * @return list<array<string, mixed>>
     */
    private function cancellationPolicy(array $policy): array
    {
        $normalized = [];
        foreach ($policy as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $normalized[] = [
                'fees' => (float) ($entry['Fees'] ?? 0),
                'type' => $entry['Type'] ?? null,
                'nature' => $entry['Nature'] ?? null,
                'description' => $entry['Description'] ?? null,
                'from_date' => $entry['FromDate'] ?? null,
            ];
        }

        return $normalized;
    }
}
