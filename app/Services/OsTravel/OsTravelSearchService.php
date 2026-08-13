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
     * Live search + filter engine.
     *
     * Resolves the candidate set of published OS-TRAVEL hotels, applies the
     * pre-filters the provider cannot do (city, stars), calls `HotelSearch`
     * in chunks of ≤ 200 with `Filters.Category` + `OnlyAvailable`, then
     * post-filters by live price range and boarding, and sorts. Everything the
     * user sees is computed by the provider for their exact dates/occupancy —
     * never from stored prices (except the `available=false` fallback).
     *
     * @param  list<string>  $hotelSlugs  Slugs to restrict to. Empty = all published hotels.
     * @param  array<string, mixed>  $options  See {@see normalizeOptions()}.
     * @return list<array<string, mixed>>
     */
    public function search(array $hotelSlugs, array $options = []): array
    {
        $options = $this->normalizeOptions($options);
        $searchDetails = $this->searchDetails($options);
        $cacheKey = 'hotels.search.'.sha1(serialize([$hotelSlugs, $options]));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($hotelSlugs, $options, $searchDetails) {
            $query = OsTravelHotel::query()
                ->where('status', OsTravelHotel::PUBLISHED)
                ->with('hotel');

            if ($hotelSlugs !== []) {
                $query->whereHas('hotel', fn ($q) => $q->whereIn('slug', $hotelSlugs));
            }

            if ($options['city_id'] !== null) {
                $query->where('city_external_id', $options['city_id']);
            }

            if ($options['stars'] !== null) {
                $query->whereHas('hotel', fn ($q) => $q->where('stars', '>=', $options['stars']));
            }

            $staged = $query->get()->keyBy('external_id');

            if ($staged->isEmpty()) {
                return [];
            }

            $results = [];
            $seenIds = [];
            $nights = $this->calculator->nightsBetween(
                $searchDetails['check_in'],
                $searchDetails['check_out'],
            );

            $chunks = array_chunk($staged->keys()->all(), self::MAX_HOTELS_PER_REQUEST);
            $throttleMs = (int) config('ostravel.search.throttle_ms', 150);

            foreach ($chunks as $index => $chunk) {
                if ($index > 0 && $throttleMs > 0) {
                    usleep($throttleMs * 1000);
                }

                try {
                    $envelope = $this->client->hotelSearch([
                        'BookingDetails' => [
                            'CheckIn' => $searchDetails['check_in'],
                            'CheckOut' => $searchDetails['check_out'],
                            'Hotels' => array_map('intval', $chunk),
                        ],
                        'Filters' => [
                            'OnlyAvailable' => (bool) $options['only_available'],
                            'Category' => $options['category_ids'],
                        ],
                        'Rooms' => $this->providerRooms($options['rooms']),
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
                    $seenIds[$externalId] = true;

                    $normalized = $this->normalize($item->hotel, $providerHotel, $nights);

                    // Boarding is not a provider filter; drop rooms that don't
                    // match, and the hotel if no matching room remains.
                    if ($options['boarding_ids'] !== []) {
                        $normalized['rooms'] = array_values(array_filter(
                            $normalized['rooms'],
                            fn (array $room) => in_array($room['boarding_id'], $options['boarding_ids'], true)
                        ));

                        if ($normalized['rooms'] === []) {
                            continue;
                        }

                        $aggregate = $this->aggregateRooms($normalized['rooms'], $item->hotel, $nights, $normalized['currency']);
                        $normalized = array_merge($normalized, $aggregate);
                    }

                    $results[] = $normalized;
                }
            }

            // `only_available=false`: keep candidates the provider omitted so the
            // UI can grey them out instead of silently hiding them.
            if (! $options['only_available']) {
                foreach ($staged as $externalId => $item) {
                    if (isset($seenIds[$externalId]) || $item->hotel === null) {
                        continue;
                    }

                    $result = $this->basePayload($item->hotel);
                    $result['available'] = false;
                    $result['rooms'] = [];
                    $result = array_merge($result, [
                        'price' => $item->hotel->price,
                        'price_total' => $item->hotel->price,
                        'price_per_night' => $this->calculator->perNight($item->hotel->price, $nights),
                        'base_price' => $item->hotel->base_price,
                        'currency' => $item->hotel->currency,
                        'nights' => $nights,
                    ]);

                    $results[] = $result;
                }
            }

            return $this->finalize($results, $options);
        });
    }

    /**
     * Apply the live price-range post-filter and the requested sort.
     *
     * @param  list<array<string, mixed>>  $results
     * @param  array<string, mixed>  $options
     * @return list<array<string, mixed>>
     */
    private function finalize(array $results, array $options): array
    {
        if ($options['price_min'] !== null || $options['price_max'] !== null) {
            $results = array_values(array_filter(
                $results,
                fn (array $result) => ($options['price_min'] === null || $result['price'] >= $options['price_min'])
                    && ($options['price_max'] === null || $result['price'] <= $options['price_max'])
            ));
        }

        $sort = $options['sort'];

        usort($results, function (array $a, array $b) use ($sort): int {
            // Available hotels always sort before unavailable ones.
            if ($a['available'] !== $b['available']) {
                return $a['available'] ? -1 : 1;
            }

            return match ($sort) {
                'price_desc' => $b['price'] <=> $a['price'],
                'stars_desc' => $b['stars'] <=> $a['stars'],
                default => $a['price'] <=> $b['price'],
            };
        });

        return $results;
    }

    /**
     * Canonicalize search/filter options. All keys are always present so the
     * cache key is deterministic regardless of which filters the caller set.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function normalizeOptions(array $options): array
    {
        $checkIn = $options['check_in'] ?? Carbon::today()->addDay()->toDateString();
        $checkOut = $options['check_out'] ?? Carbon::parse($checkIn)->addDays(7)->toDateString();

        return [
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'rooms' => $options['rooms'] ?? [],
            'only_available' => (bool) ($options['only_available'] ?? true),
            'city_id' => isset($options['city_id']) && $options['city_id'] !== null && $options['city_id'] !== ''
                ? (string) $options['city_id']
                : null,
            'stars' => isset($options['stars']) && $options['stars'] !== null
                ? (int) $options['stars']
                : null,
            'category_ids' => array_values(array_unique(array_map('intval', $options['category_ids'] ?? []))),
            'boarding_ids' => array_values(array_unique(array_map('intval', $options['boarding_ids'] ?? []))),
            'price_min' => isset($options['price_min']) && $options['price_min'] !== null
                ? (int) $options['price_min']
                : null,
            'price_max' => isset($options['price_max']) && $options['price_max'] !== null
                ? (int) $options['price_max']
                : null,
            'sort' => in_array($options['sort'] ?? null, ['price_desc', 'stars_desc'], true)
                ? $options['sort']
                : 'price_asc',
        ];
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

        $result = $this->basePayload($hotel);
        $result['rooms'] = $rooms;

        return array_merge(
            $result,
            $this->aggregateRooms($rooms, $hotel, $nights, $currency),
        );
    }

    /**
     * Common hotel metadata that is independent of provider availability.
     *
     * @return array<string, mixed>
     */
    private function basePayload(Hotel $hotel): array
    {
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
            'markup_percentage' => $hotel->markup_percentage,
            'provider' => 'ostravel',
            'available' => true,
        ];
    }

    /**
     * Derive the hotel-level price summary from a set of rooms (or fall back
     * to the stored price when every room is stopped).
     *
     * @param  list<array<string, mixed>>  $rooms
     * @return array<string, mixed>
     */
    private function aggregateRooms(array $rooms, Hotel $hotel, int $nights, string $currency): array
    {
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
            // Stay-total semantics: `price` is the cheapest available room's
            // total for the whole stay (marked up); fall back to stored when
            // every room is stopped.
            'price' => $minRoom['price'] ?? $hotel->price,
            'price_total' => $minRoom['price_total'] ?? $hotel->price,
            'price_per_night' => $minRoom['price_per_night'] ?? $this->calculator->perNight($hotel->price, $nights),
            'base_price' => $minRoom['base_price'] ?? $hotel->base_price,
            'currency' => $minRoom['currency'] ?? $currency,
            'nights' => $nights,
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
