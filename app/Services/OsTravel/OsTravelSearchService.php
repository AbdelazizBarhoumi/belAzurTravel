<?php

namespace App\Services\OsTravel;

use App\Exceptions\OsTravelHorizonExceededException;
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
                ->whereNotNull('hotel_id')
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

            // Manual hotels (Stage 2) are always candidates with their stored
            // price — never sent to the provider. Provider-only filters (city
            // external id, category, boarding) don't apply to them. Hotels with
            // a published provider row are excluded regardless of the column so
            // a single hotel can never be returned twice.
            $manualHotels = Hotel::query()
                ->where('source', Hotel::SOURCE_MANUAL)
                ->whereNotIn('id', OsTravelHotel::query()
                    ->whereNotNull('hotel_id')
                    ->pluck('hotel_id'))
                ->when($hotelSlugs !== [], fn ($q) => $q->whereIn('slug', $hotelSlugs))
                ->when($options['stars'] !== null, fn ($q) => $q->where('stars', '>=', $options['stars']))
                ->get();

            if ($staged->isEmpty() && $manualHotels->isEmpty()) {
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

                    $normalized = $this->normalize(
                        $item->hotel,
                        $providerHotel,
                        $nights,
                        $searchDetails['check_in'],
                        $searchDetails['check_out'],
                    );

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

                    // `OnlyAvailable: true` must only ever surface bookable
                    // hotels. A hotel the provider returned with no bookable
                    // room for the searched window is dropped; with
                    // `OnlyAvailable: false` it is kept and flagged instead.
                    if ($options['only_available'] && ! $normalized['available']) {
                        continue;
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
                    $result['unavailable_reason'] = 'not_returned';
                    $result['first_available_at'] = null;
                    $result['min_nights'] = $item->hotel->min_nights;
                    $result['rooms'] = [];
                    $result = array_merge($result, [
                        'price' => $item->hotel->price,
                        'price_total' => $item->hotel->price,
                        // The stored price is the total for the hotel's minimum
                        // stay, so the per-night figure divides by that basis.
                        'price_per_night' => $this->calculator->perNight($item->hotel->price, $item->hotel->min_nights ?? $nights),
                        'base_price' => $item->hotel->base_price,
                        'currency' => $item->hotel->currency,
                        'nights' => $nights,
                    ]);

                    $results[] = $result;
                }
            }

            // Manual hotels: stored price, always available, no provider call.
            foreach ($manualHotels as $manualHotel) {
                $results[] = $this->manualPayload($manualHotel, $nights);
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
     * Best-known price used by the browse-mode scheduler. Runs a batched
     * search for all published hotels on the default window and persists
     * `last_price` / `last_price_at` on `hotels` alongside the nearest
     * available day (`first_available_at`) and the minimum stay (`min_nights`)
     * the price is normalized from. Hotels with no live availability in that
     * window have their price cleared so browse never shows a stale or
     * approximated value, but keep their availability metadata so the public
     * site can still surface the reopen day.
     *
     * @param  array<string, mixed>  $options  Same options as {@see search()}.
     * @return array{updated: int, omitted: int}
     */
    public function refreshLatestPrices(array $options = []): array
    {
        $published = OsTravelHotel::query()
            ->whereNotNull('hotel_id')
            ->with('hotel')
            ->get()
            ->keyBy('external_id');

        if ($published->isEmpty()) {
            return ['updated' => 0, 'omitted' => 0];
        }

        $options['only_available'] ??= true;
        $probe = $this->probePrices($published->keys()->all(), $options);

        $updated = 0;
        foreach ($probe['prices'] as $externalId => $value) {
            $item = $published->get($externalId);
            if ($item === null || $item->hotel === null) {
                continue;
            }

            $item->hotel->update([
                'last_price' => $value['price'],
                'last_price_at' => now(),
                'first_available_at' => $value['first_available_at'],
                'min_nights' => $value['min_nights'],
                'stop_sale_ranges' => $probe['ranges'][$externalId] ?? [],
                'details' => $this->mergeCatalog($item->hotel->details ?? [], $probe['catalog'][$externalId] ?? null),
            ]);
            $updated++;
        }

        // Returned but not bookable in the default window: no live price, so
        // clear it, but keep the reopen metadata the provider returned so
        // browse can still show when the hotel is back.
        foreach ($probe['unavailable'] as $externalId => $meta) {
            $item = $published->get($externalId);
            if ($item === null || $item->hotel === null) {
                continue;
            }

            $item->hotel->update([
                'last_price' => null,
                'last_price_at' => null,
                'first_available_at' => $meta['first_available_at'],
                'min_nights' => $meta['min_nights'],
                'stop_sale_ranges' => $probe['ranges'][$externalId] ?? [],
                'details' => $this->mergeCatalog($item->hotel->details ?? [], $probe['catalog'][$externalId] ?? null),
            ]);
        }

        // No live price for this hotel at all: clear the stored browse price
        // and its availability metadata so it is never shown as stale.
        foreach ($probe['omitted_ids'] as $externalId) {
            $item = $published->get($externalId);
            if ($item === null || $item->hotel === null) {
                continue;
            }

            $item->hotel->update([
                'last_price' => null,
                'last_price_at' => null,
                'first_available_at' => null,
                'min_nights' => null,
                'stop_sale_ranges' => [],
                'details' => $this->mergeCatalog($item->hotel->details ?? [], null),
            ]);
        }

        return [
            'updated' => $updated,
            'omitted' => count($probe['unavailable']) + count($probe['omitted_ids']),
        ];
    }

    /**
     * Refresh the provider's minimum price for staged (pending/approved)
     * hotels and persist it as their `base_price`, so the admin can review
     * and approve without typing a price by hand. Probes the default window
     * once per chunk and records the nearest available day and minimum stay.
     * Hotels with no live availability in that window have their `base_price`
     * cleared so a stale or approximated value is never staged, and their
     * `availability_status` records why (stop-sale / stop-reservation /
     * no bookable room / not returned). Optionally restrict to a set of
     * staging row ids.
     *
     * @param  list<int>  $ids
     * @return array{updated: int, omitted: int, omitted_ids: list<string>, failed_ids: list<string>}
     */
    public function refreshStagedPrices(array $ids = [], array $options = []): array
    {
        $query = OsTravelHotel::query()->whereNotNull('external_id');

        if ($ids !== []) {
            // A targeted refresh may reprice any staging row — pending,
            // approved, or live (so the live price can be synced without
            // unpublishing first), rejected, or orphaned — whatever the admin
            // is currently looking at.
            $query->whereIn('id', $ids);
        } else {
            // The bulk refresh only targets staged rows that are not live yet;
            // live hotels get their prices from the browse-mode scheduler.
            $query->whereIn('status', [OsTravelHotel::PENDING, OsTravelHotel::APPROVED])
                ->whereNull('hotel_id');
        }

        $staged = $query->get()->keyBy('external_id');

        if ($staged->isEmpty()) {
            return ['updated' => 0, 'omitted' => 0, 'omitted_ids' => [], 'failed_ids' => []];
        }

        $options['only_available'] ??= true;
        $probe = $this->probePrices($staged->keys()->all(), $options);

        $updated = 0;
        foreach ($probe['prices'] as $externalId => $value) {
            $item = $staged->get($externalId);
            if ($item === null) {
                continue;
            }

            $item->update([
                'base_price' => (int) round($value['price']),
                'currency' => $value['currency'],
                'price_status' => OsTravelHotel::PRICE_HAS_PRICE,
                'availability_status' => OsTravelHotel::AVAILABILITY_AVAILABLE,
                'last_price_attempt_at' => now(),
                'first_available_at' => $value['first_available_at'],
                'min_nights' => $value['min_nights'],
                'stop_sale_ranges' => $probe['ranges'][$externalId] ?? [],
                'payload' => $this->mergeCatalog($item->payload ?? [], $probe['catalog'][$externalId] ?? null),
            ]);

            $this->syncPublishedHotel($item, (int) round($value['price']), $value['currency']);
            $updated++;
        }

        // Returned but not bookable in the base window: record why and keep the
        // nearest available day / minimum stay the provider returned so the
        // admin sees the reopen info instead of a bare "no price".
        $noPriceIds = [];
        foreach ($probe['unavailable'] as $externalId => $meta) {
            $item = $staged->get($externalId);
            if ($item === null) {
                continue;
            }

            $noPriceIds[] = (string) $externalId;

            $item->update([
                'base_price' => null,
                'price_status' => OsTravelHotel::PRICE_NO_AVAILABILITY,
                'availability_status' => $meta['reason'] ?? OsTravelHotel::AVAILABILITY_NO_BOOKABLE_ROOM,
                'last_price_attempt_at' => now(),
                'first_available_at' => $meta['first_available_at'],
                'min_nights' => $meta['min_nights'],
                'stop_sale_ranges' => $probe['ranges'][$externalId] ?? [],
                'payload' => $this->mergeCatalog($item->payload ?? [], $probe['catalog'][$externalId] ?? null),
            ]);

            $this->syncPublishedHotel($item, null, $item->currency);
        }

        // No live price for this hotel in the base window: clear the staged
        // price and its availability metadata so it is never shown as stale,
        // and flag it as not returned.
        foreach ($probe['omitted_ids'] as $externalId) {
            $item = $staged->get($externalId);
            if ($item === null) {
                continue;
            }

            $noPriceIds[] = (string) $externalId;

            $item->update([
                'base_price' => null,
                'price_status' => OsTravelHotel::PRICE_NO_AVAILABILITY,
                'availability_status' => OsTravelHotel::AVAILABILITY_NOT_RETURNED,
                'last_price_attempt_at' => now(),
                'first_available_at' => null,
                'min_nights' => null,
                'stop_sale_ranges' => [],
                'payload' => $this->mergeCatalog($item->payload ?? [], null),
            ]);

            $this->syncPublishedHotel($item, null, $item->currency);
        }

        // Transient provider failures keep their previous value but are
        // reported distinctly so the admin knows the refresh didn't cover them.
        foreach ($probe['failed_ids'] as $externalId) {
            $item = $staged->get($externalId);
            if ($item === null) {
                continue;
            }

            $item->update([
                'price_status' => OsTravelHotel::PRICE_PROVIDER_ERROR,
                'last_price_attempt_at' => now(),
            ]);
        }

        return [
            'updated' => $updated,
            'omitted' => count($noPriceIds),
            'omitted_ids' => $noPriceIds,
            'failed_ids' => $probe['failed_ids'],
        ];
    }

    /**
     * Push a freshly refreshed price onto a published hotel so the public
     * price reflects the live provider value without unpublishing. When the
     * hotel is not published (no linked `hotels` row) this is a no-op.
     */
    private function syncPublishedHotel(OsTravelHotel $staged, ?int $basePrice, ?string $currency): void
    {
        if ($staged->hotel_id === null) {
            return;
        }

        $hotel = $staged->hotel;
        if ($hotel === null) {
            return;
        }

        if ($basePrice === null) {
            return;
        }

        $markup = (float) ($staged->markup_percentage ?? config('ostravel.markup.default', 20));

        $hotel->forceFill([
            'base_price' => $basePrice,
            'price' => (int) round($basePrice * (1 + $markup / 100)),
            'currency' => $currency ?? $staged->currency ?? $hotel->currency,
            'last_price' => $basePrice,
            'last_price_at' => now(),
            'first_available_at' => $staged->first_available_at,
            'min_nights' => $staged->min_nights,
            'stop_sale_ranges' => $staged->stop_sale_ranges ?? [],
        ])->save();
    }

    /**
     * Query the provider for the minimum bookable price of a set of external
     * ids. A hotel's stored price is the total for its minimum stay, never a
     * per-night figure: a room with `MinStay` 5 is quoted as the 5-night total.
     *
     * Hotels are partitioned by their stored `min_nights` and probed in
     * ascending minimum-stay groups: group n calls `HotelSearch` on
     * `check_in → check_in + n nights` (the base check-in defaults to tomorrow)
     * with a single `OnlyAvailable: false` call per chunk of ≤
     * `MAX_HOTELS_PER_REQUEST`. Unlike `OnlyAvailable: true`, the provider
     * still returns hotels that are not bookable for a window, together with
     * the room metadata that explains why: `MinStay` (the room's minimum stay),
     * `StopSales` (a date range during which booking is closed — the day after
     * its end is the nearest available day), `StopReservation` (permanently
     * closed) and `OnRequest`. A hotel bookable in its own group is priced
     * directly at its check-in: that window's total is exactly its
     * minimum-stay price. Hotels with a null/≤1 stored minimum stay probe the
     * 1-night group; hotels with a longer stored minimum stay go straight to
     * their own group, skipping the short-window probes that can never price
     * them. Groups are processed in ascending order up to
     * `ostravel.refresh.max_min_stay` (default 30); a longer stay is reported
     * unavailable.
     *
     * When a probe reveals a hotel's real minimum stay differs from the stored
     * `min_nights`, that value is persisted immediately — on the staging row
     * and on any linked published hotel — so later groups, later chunks and
     * later runs group the hotel correctly without re-discovering it.
     *
     * A returned-but-not-bookable hotel whose real minimum stay is longer than
     * its group's and that would be bookable at that minimum stay is scheduled
     * into its real group (this includes hotels whose minimum stay was just
     * learned). One already blocked at its minimum stay (e.g. a stop-sale
     * covering the minstay window) is reported in `unavailable` with the reason
     * and nearest available day instead of being probed forward.
     *
     * A hotel is reported as omitted when it is never returned by the provider.
     * Provider failures abort the affected chunk (no re-query) and are excluded
     * from `omitted_ids` because they are transient errors rather than a lack of
     * availability. A probe window past the provider's bookable horizon
     * ("CheckIn dépasser") is not a failure either: it counts as omitted and
     * short-circuits every longer group, since a fixed check-in further out can
     * never be priced.
     *
     * @param  list<string>  $externalIds
     * @param  array<string, mixed>  $options
     * @return array{prices: array<string, array{price: float, currency: string, first_available_at: string, min_nights: int}>, unavailable: array<string, array{reason: string|null, first_available_at: string|null, min_nights: int|null}>, ranges: array<string, list<array{from: string, to: string}>>, catalog: array<string, array<string, mixed>>, omitted: int, omitted_ids: list<string>, failed_ids: list<string>}
     */
    private function probePrices(array $externalIds, array $options): array
    {
        // Eloquent keyBy() returns int keys for numeric external ids, but the
        // provider envelope always yields strings. Normalize once.
        $externalIds = array_values(array_map('strval', $externalIds));

        if ($externalIds === []) {
            return [
                'prices' => [],
                'unavailable' => [],
                'ranges' => [],
                'catalog' => [],
                'omitted' => 0,
                'omitted_ids' => [],
                'failed_ids' => [],
            ];
        }

        // Base check-in defaults to tomorrow (production). Callers (tests, the
        // scheduler) may pin it explicitly; the window length always equals the
        // group's minimum stay, never a caller-provided check-out.
        $checkIn = $options['check_in'] ?? Carbon::today()->addDay()->toDateString();
        $maxMinStay = max(1, (int) config('ostravel.refresh.max_min_stay', 30));
        $throttleMs = (int) config('ostravel.search.throttle_ms', 150);
        $calls = 0;

        $prices = [];
        $unavailable = [];
        $ranges = [];
        $catalogs = [];
        $failedIds = [];
        // External ids already classified (priced or recorded unavailable) so a
        // hotel is never probed twice across groups.
        $classified = [];

        // Working set keyed by external id. `min_nights` is read fresh from the
        // DB and kept in sync as probes reveal the provider's real minimum stay.
        $staged = OsTravelHotel::query()
            ->whereIn('external_id', $externalIds)
            ->get()
            ->keyBy('external_id');

        // Partition by stored minimum stay: null / ≤1 probe the 1-night group,
        // longer stays go straight to their own group (clamped to the horizon).
        $queue = [];
        foreach ($staged as $externalId => $row) {
            // Eloquent keyBy() returns int keys for numeric external ids, but
            // the provider envelope and the failed/omitted lists always carry
            // strings. Normalize once.
            $externalId = (string) $externalId;
            $minstay = $row->min_nights;
            if ($minstay === null || $minstay <= 1) {
                $queue[1][] = $externalId;
            } else {
                $queue[min($minstay, $maxMinStay)][] = $externalId;
            }
        }

        for ($ms = 1; $ms <= $maxMinStay; $ms++) {
            $ids = array_values(array_unique(array_diff($queue[$ms] ?? [], $classified)));
            if ($ids === []) {
                continue;
            }

            $checkOut = Carbon::parse($checkIn)->addDays($ms)->toDateString();
            $windowOptions = array_merge($options, [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'only_available' => false,
            ]);

            foreach (array_chunk($ids, self::MAX_HOTELS_PER_REQUEST) as $chunk) {
                $this->throttle($throttleMs, $calls);

                try {
                    $envelope = $this->providerEnvelope($chunk, $this->searchDetails($windowOptions), $windowOptions);
                } catch (OsTravelHorizonExceededException) {
                    // This window is already past the provider's bookable
                    // horizon; with a fixed check-in every longer window is
                    // too, so the whole remaining scan is pointless. The
                    // chunk counts as omitted (no availability within the
                    // horizon), never as a provider failure.
                    $omittedIds = array_values(array_diff(
                        $externalIds,
                        array_keys($prices),
                        array_keys($unavailable),
                        $failedIds,
                    ));

                    return [
                        'prices' => $prices,
                        'unavailable' => $unavailable,
                        'ranges' => $ranges,
                        'catalog' => $catalogs,
                        'omitted' => count($omittedIds),
                        'omitted_ids' => $omittedIds,
                        'failed_ids' => $failedIds,
                    ];
                }
                if ($envelope === null) {
                    $failedIds = array_merge($failedIds, $chunk);

                    continue;
                }

                foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                    $externalId = (string) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? '');
                    if (! in_array($externalId, $externalIds, true)) {
                        continue;
                    }

                    $offers = $this->roomOffers($providerHotel);
                    $ranges[$externalId] = $this->hotelUnavailableRanges($offers);
                    $catalogs[$externalId] = $this->catalogOf($providerHotel);

                    // The real minimum stay, read from the provider response
                    // (ignoring permanently stop-reserved rooms).
                    $nonReserved = array_values(array_filter(
                        $offers,
                        fn (array $offer) => ! $offer['stop_reservation']
                    ));
                    $actualMinStay = $this->minStayOf($nonReserved);

                    // Persist a changed minimum stay NOW so later groups, later
                    // chunks and later runs group this hotel correctly.
                    $row = $staged[$externalId] ?? null;
                    if ($actualMinStay !== null
                        && $row !== null
                        && (int) ($row->min_nights ?? 0) !== $actualMinStay) {
                        $row->min_nights = $actualMinStay;
                        $row->save();
                        $this->syncPublishedMinStay($row, $actualMinStay);
                    }

                    $bookable = array_values(array_filter(
                        $offers,
                        fn (array $offer) => $this->roomBookable($offer, $checkIn, $checkOut)
                    ));

                    if ($bookable !== []) {
                        // Bookable in its group window: that window's total is
                        // exactly its minimum-stay price (no per-night
                        // division).
                        $minPrice = $this->minOfferPrice($bookable);
                        if ($minPrice !== null) {
                            $prices[$externalId] = [
                                'price' => round($minPrice, 2),
                                'currency' => $this->calculator->currency($providerHotel['Currency'] ?? null),
                                'first_available_at' => $checkIn,
                                'min_nights' => (int) $this->minStayOf($bookable),
                            ];
                            $classified[$externalId] = true;
                        }

                        continue;
                    }

                    // Not bookable in this group's window. A longer real minimum
                    // stay is the only recoverable case: quote it at that
                    // minimum stay. A hotel already blocked at its real minimum
                    // stay (stop-sale / stop-reservation) is recorded with the
                    // reason and nearest available day instead.
                    if ($actualMinStay !== null && $actualMinStay > $ms && $actualMinStay <= $maxMinStay) {
                        $minStayCheckOut = Carbon::parse($checkIn)->addDays($actualMinStay)->toDateString();
                        $canPriceAtMinStay = array_filter(
                            $nonReserved,
                            fn (array $offer) => $this->roomBookable($offer, $checkIn, $minStayCheckOut)
                        );

                        if ($canPriceAtMinStay !== []) {
                            // Schedule into its real group; not classified yet,
                            // so that group's probe picks it up.
                            $queue[$actualMinStay][] = $externalId;

                            continue;
                        }

                        $unavailable[$externalId] = $this->availabilityMeta($offers, $checkIn, $minStayCheckOut);
                        $classified[$externalId] = true;

                        continue;
                    }

                    // Same-or-shorter minimum stay but blocked for this window.
                    $unavailable[$externalId] = $this->availabilityMeta($offers, $checkIn, $checkOut);
                    $classified[$externalId] = true;
                }
            }
        }

        // A hotel is "omitted" (no availability) when it was never returned by
        // the provider. Returned-but-not-bookable hotels are in `unavailable`.
        // Transient provider failures are not omitted: keep their previous value.
        $omittedIds = array_values(array_diff(
            $externalIds,
            array_keys($prices),
            array_keys($unavailable),
            $failedIds,
        ));

        return [
            'prices' => $prices,
            'unavailable' => $unavailable,
            'ranges' => $ranges,
            'catalog' => $catalogs,
            'omitted' => count($omittedIds),
            'omitted_ids' => $omittedIds,
            'failed_ids' => $failedIds,
        ];
    }

    /**
     * Push a freshly discovered minimum stay onto a published hotel so the
     * public side groups and divides by the same basis without waiting for the
     * next pricing run. When the hotel is not published (no linked `hotels`
     * row) this is a no-op.
     */
    private function syncPublishedMinStay(OsTravelHotel $staged, int $minNights): void
    {
        if ($staged->hotel_id === null) {
            return;
        }

        Hotel::query()->whereKey($staged->hotel_id)->update(['min_nights' => $minNights]);
    }

    /**
     * Probe a single date window for a set of external ids (no forward
     * scanning). Used by the admin list's live-check filter: the admin picks
     * dates and the list reports, for that exact window, which hotels have a
     * live price, which are unavailable and why (stop-sale with its reopen
     * day, min-stay longer than the picked nights, or no bookable room), and
     * which hit a provider error. A hotel is only priced when it is bookable
     * for the exact picked window: shorter-than-min-stay picks are reported
     * unavailable instead of being re-quoted at the minimum stay, so the
     * admin's "full price" never contradicts the picked duration.
     *
     * @param  list<string>  $externalIds
     * @return array{prices: array<string, array{price: float, currency: string}>, unavailable: array<string, array{reason: string|null, first_available_at: string|null, min_nights: int|null}>, omitted_ids: list<string>, failed_ids: list<string>}
     */
    public function probeWindow(array $externalIds, string $checkIn, string $checkOut): array
    {
        $externalIds = array_values(array_map('strval', $externalIds));
        $throttleMs = (int) config('ostravel.search.throttle_ms', 150);

        $options = [
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'only_available' => false,
        ];
        $searchDetails = $this->searchDetails($options);

        $prices = [];
        $unavailable = [];
        $failedIds = [];
        $calls = 0;

        foreach (array_chunk($externalIds, self::MAX_HOTELS_PER_REQUEST) as $chunk) {
            $this->throttle($throttleMs, $calls);

            try {
                $envelope = $this->providerEnvelope($chunk, $searchDetails, $options);
            } catch (OsTravelHorizonExceededException) {
                // The admin-picked window is past the bookable horizon: no
                // live price can exist there, so the chunk is omitted rather
                // than reported as a provider failure.
                continue;
            }
            if ($envelope === null) {
                $failedIds = array_merge($failedIds, $chunk);

                continue;
            }

            foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                $externalId = (string) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? '');
                if (! in_array($externalId, $externalIds, true)) {
                    continue;
                }

                $offers = $this->roomOffers($providerHotel);
                $bookable = array_values(array_filter(
                    $offers,
                    fn (array $offer) => $this->roomBookable($offer, $checkIn, $checkOut)
                ));

                $minPrice = $this->minOfferPrice($bookable);
                if ($minPrice !== null) {
                    $prices[$externalId] = [
                        'price' => round($minPrice, 2),
                        'currency' => $this->calculator->currency($providerHotel['Currency'] ?? null),
                    ];

                    continue;
                }

                // No bookable room for the exact picked window (a minimum stay
                // longer than the picked nights, a stop-sale covering the
                // dates, or stop-reservation). The hotel is reported
                // unavailable — never re-quoted at its minimum stay — so the
                // admin's full price always reflects the picked duration.
                $unavailable[$externalId] = $this->availabilityMeta($offers, $checkIn, $checkOut);
            }
        }

        $omittedIds = array_values(array_diff(
            $externalIds,
            array_keys($prices),
            array_keys($unavailable),
            $failedIds,
        ));

        return [
            'prices' => $prices,
            'unavailable' => $unavailable,
            'omitted_ids' => $omittedIds,
            'failed_ids' => $failedIds,
        ];
    }

    /**
     * Call the provider's `HotelSearch` for one chunk of external ids, or
     * null when the call fails (the caller decides how to report the chunk).
     *
     * @param  list<string>  $externalIds
     * @param  array{check_in: string, check_out: string, rooms: list<array{adults: int, children: list<int>}>}  $searchDetails
     * @param  array<string, mixed>  $options
     * @return array<int|string, mixed>|null
     */
    private function providerEnvelope(array $externalIds, array $searchDetails, array $options): ?array
    {
        try {
            return $this->client->hotelSearch([
                'BookingDetails' => [
                    'CheckIn' => $searchDetails['check_in'],
                    'CheckOut' => $searchDetails['check_out'],
                    'Hotels' => array_map('intval', $externalIds),
                ],
                'Filters' => [
                    'OnlyAvailable' => (bool) $options['only_available'],
                ],
                'Rooms' => $this->providerRooms($options['rooms'] ?? []),
            ]);
        } catch (Throwable $e) {
            // The provider rejects a CheckIn/CheckOut beyond its bookable
            // horizon ("CheckIn dépasser"). Probing further forward is
            // pointless, so surface it distinctly and let the caller treat
            // the chunk as having no availability rather than as a transient
            // provider failure.
            if ($this->isHorizonExceededError($e)) {
                throw new OsTravelHorizonExceededException(
                    "OS-TRAVEL {$searchDetails['check_in']} exceeds the provider's bookable horizon.",
                    0,
                    $e
                );
            }

            Log::warning('OS-TRAVEL price-refresh chunk failed.', [
                'hotels' => $externalIds,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * The provider rejects searches whose CheckIn/CheckOut fall outside its
     * bookable window with a French validation message such as
     * "Données erronées: CheckIn dépasser". Treat any error mentioning an
     * out-of-range check-in/check-out date as the horizon being exceeded.
     */
    private function isHorizonExceededError(Throwable $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'checkin dépasser')
            || str_contains($message, 'checkout dépasser');
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
            return [['Adult' => 1, 'Child' => []]];
        }

        return array_map(
            fn (array $room) => [
                'Adult' => (int) ($room['adults'] ?? 1),
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
                        // The room-level `Price` is the bookable sell price; the
                        // top-level `Price.BasePrice` is a separate reference and
                        // must never be used. Rooms always carry `Price`.
                        'price' => (float) ($room['Price'] ?? 0),
                        'stop_reservation' => (bool) ($room['StopReservation'] ?? false),
                        'min_stay' => max(1, (int) ($room['MinStay'] ?? 1)),
                        'on_request' => (bool) ($room['OnRequest'] ?? false),
                        'quantity' => isset($room['Quantity']) ? (int) $room['Quantity'] : null,
                        'stop_sales' => $this->normalizeStopSales($room['StopSales'] ?? null),
                        'cancellation_policy' => $room['CancellationPolicy'] ?? [],
                        // View ids and the raw Supplement list are echoed to the
                        // provider during booking, so keep the provider shape.
                        'view_ids' => array_map('intval', $room['View'] ?? []),
                        'supplements' => $room['Supplement'] ?? [],
                        // Content fields surfaced on the public room cards:
                        // photo, description, feature icons (Icones), refund
                        // status and the free-cancellation deadline.
                        'photo' => $this->resolveImageUrl($room['Photo'] ?? null),
                        'description' => (string) ($room['Description'] ?? ''),
                        'icones' => $this->normalizeIcones($room['Icones'] ?? []),
                        'not_refundable' => (bool) ($room['NotRefundable'] ?? false),
                        'cancellation_deadline' => $this->parseProviderDate((string) ($room['CancellationDeadline'] ?? '')),
                        'retrocession' => isset($room['Retrocession']) && (string) $room['Retrocession'] !== ''
                            ? (string) $room['Retrocession']
                            : null,
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
    private function normalize(Hotel $hotel, array $providerHotel, int $nights, string $checkIn, string $checkOut): array
    {
        $markup = (float) $hotel->markup_percentage;
        $currency = $this->calculator->currency($providerHotel['Currency'] ?? $hotel->currency);

        $rooms = [];
        $anyBookable = false;
        foreach ($this->roomOffers($providerHotel) as $offer) {
            $basePrice = $offer['price'];

            // Only bookable rooms are offered: a room whose minimum stay
            // exceeds the searched nights or whose stop-sale covers the dates
            // cannot be booked and must not surface a price.
            if (! $this->roomBookable($offer, $checkIn, $checkOut)) {
                continue;
            }

            $anyBookable = true;

            $rooms[] = [
                'id' => $offer['id'],
                'name' => $offer['name'],
                'boarding' => $offer['boarding'],
                'boarding_name' => $offer['boarding_name'],
                'boarding_id' => $offer['boarding_id'],
                'adults' => $offer['adults'],
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
                'min_stay' => $offer['min_stay'],
                'on_request' => $offer['on_request'],
                'quantity' => $offer['quantity'],
                'stop_sales' => $offer['stop_sales'],
                'cancellation_policy' => $this->cancellationPolicy($offer['cancellation_policy']),
                'supplements' => $offer['supplements'],
                'image' => OsTravelImageProxy::publicUrl($offer['photo']),
                'description' => $offer['description'],
                'features' => $offer['icones'],
                'not_refundable' => $offer['not_refundable'],
                'cancellation_deadline' => $offer['cancellation_deadline'],
                'retrocession' => $offer['retrocession'],
            ];
        }

        $result = array_merge($this->basePayload($hotel), $this->hotelPayload($providerHotel));

        // The provider returns hotels with no bookable room for the searched
        // window only when `OnlyAvailable: false`. Surface them as unavailable
        // with the metadata the provider returned (StopSales range → nearest
        // available day, MinStay → minimum nights) instead of pretending they
        // are bookable — the `search()` caller drops them when
        // `only_available=true`.
        if (! $anyBookable) {
            $meta = $this->availabilityMeta($this->roomOffers($providerHotel), $checkIn, $checkOut);

            $result['available'] = false;
            $result['rooms'] = [];
            $result['unavailable_reason'] = $meta['reason'];
            $result['first_available_at'] = $meta['first_available_at'];
            $result['min_nights'] = $meta['min_nights'];

            return array_merge($result, [
                'price' => $hotel->price,
                'price_total' => $hotel->price,
                // The stored price is the total for the hotel's minimum stay,
                // so the per-night figure divides by that basis.
                'price_per_night' => $this->calculator->perNight($hotel->price, $hotel->min_nights ?? $meta['min_nights'] ?? $nights),
                'base_price' => $hotel->base_price,
                'currency' => $hotel->currency,
                'nights' => $nights,
            ]);
        }

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
     * Hotel-level provider metadata surfaced on the search result: promotion,
     * free-child ages, recommended flag and a short description.
     *
     * @param  array<string, mixed>  $providerHotel
     * @return array<string, mixed>
     */
    private function hotelPayload(array $providerHotel): array
    {
        $promotion = $providerHotel['Promotion'] ?? null;

        return [
            'promotion' => is_array($promotion) ? [
                'title' => ($promotion['Title'] ?? null) !== null ? (string) $promotion['Title'] : null,
                'description' => (string) ($promotion['Description'] ?? ''),
                'rate' => ($promotion['Rate'] ?? null) !== null ? (string) $promotion['Rate'] : null,
            ] : null,
            'free_child' => $this->freeChildAges($providerHotel['FreeChild'] ?? []),
            'recommended' => (bool) ($providerHotel['Recommended'] ?? 0),
            'short_description' => $this->shortDescription($providerHotel['Hotel'] ?? []),
        ];
    }

    /**
     * Normalized browse catalog for a returned provider hotel: the boardings it
     * offers, its quoted rooms (deduplicated per room+boarding) with content
     * fields, and the hotel-level promotion/free-child/recommended metadata.
     * Persisted by the refresh flows so browse mode and the pre-search detail
     * page render real snapshot data with no live call. Rooms carry their
     * `boarding_id` so the frontend can group them by boarding like the live
     * search rooms do.
     *
     * @param  array<string, mixed>  $providerHotel
     * @return array<string, mixed>
     */
    private function catalogOf(array $providerHotel): array
    {
        $boardings = [];
        $rooms = [];
        $seenBoardings = [];
        $seenRooms = [];

        foreach ($this->roomOffers($providerHotel) as $offer) {
            $boardingId = $offer['boarding_id'];

            if ($boardingId !== null && ! isset($seenBoardings[$boardingId])) {
                $seenBoardings[$boardingId] = true;
                $boardings[] = [
                    'id' => $boardingId,
                    'code' => $offer['boarding'],
                    'name' => $offer['boarding_name'],
                ];
            }

            $roomKey = $offer['id'].':'.$boardingId;
            if (! isset($seenRooms[$roomKey])) {
                $seenRooms[$roomKey] = true;
                $rooms[] = [
                    'name' => $offer['name'],
                    'photo' => OsTravelImageProxy::publicUrl($offer['photo']),
                    'description' => $offer['description'],
                    'features' => $offer['icones'],
                    'min_stay' => $offer['min_stay'],
                    'boarding_id' => $boardingId,
                ];
            }
        }

        $payload = $this->hotelPayload($providerHotel);

        return [
            'boardings' => $boardings,
            'rooms' => $rooms,
            'promotion' => $payload['promotion'],
            'free_child' => $payload['free_child'],
            'recommended' => $payload['recommended'],
        ];
    }

    /**
     * Merge a catalog onto a JSON details/payload array, or drop it when the
     * catalog is null so a hotel the provider stopped returning never shows
     * stale rooms/promo.
     *
     * @param  array<string, mixed>  $target
     * @param  array<string, mixed>|null  $catalog
     * @return array<string, mixed>
     */
    private function mergeCatalog(array $target, ?array $catalog): array
    {
        if ($catalog === null) {
            unset($target['catalog']);
        } else {
            $target['catalog'] = $catalog;
        }

        return $target;
    }

    /**
     * Extract child ages from the provider `FreeChild` list.
     *
     * @param  array<int, mixed>  $freeChild
     * @return list<int>
     */
    private function freeChildAges(array $freeChild): array
    {
        $ages = [];
        foreach ($freeChild as $child) {
            if (is_array($child) && isset($child['Age']) && is_numeric($child['Age'])) {
                $ages[] = (int) $child['Age'];
            }
        }

        return array_values(array_unique($ages));
    }

    /**
     * Normalize the provider short description (HTML) to plain text.
     *
     * @param  array<string, mixed>  $hotel
     */
    private function shortDescription(array $hotel): ?string
    {
        $raw = $hotel['ShortDescription'] ?? $hotel['HotelDescription'] ?? null;

        if ($raw === null || (string) $raw === '') {
            return null;
        }

        $text = HotelPublisher::htmlToText((string) $raw);
        $text = implode("\n", array_map('trim', explode("\n", $text)));

        return $text === '' ? null : $text;
    }

    /**
     * Resolve a provider-relative image path against the base URL, keeping
     * absolute URLs and nulls untouched.
     */
    private function resolveImageUrl(mixed $path): ?string
    {
        if (! is_scalar($path)) {
            return null;
        }

        $path = trim((string) $path);

        if ($path === '' || preg_match('#^https?://#i', $path)) {
            return $path === '' ? null : $path;
        }

        return rtrim((string) config('ostravel.base_url'), '/').'/'.ltrim($path, '/');
    }

    /**
     * Normalize a room's `Icones` list into feature badges. Entries may be
     * plain strings, null, or objects carrying a `Title`.
     *
     * @param  array<int, mixed>  $icones
     * @return list<string>
     */
    private function normalizeIcones(array $icones): array
    {
        $features = [];
        foreach ($icones as $icone) {
            if (is_array($icone)) {
                $icone = $icone['Title'] ?? $icone['Name'] ?? null;
            }
            if (! is_scalar($icone) || trim((string) $icone) === '') {
                continue;
            }
            $features[] = trim((string) $icone);
        }

        return array_values(array_unique($features));
    }

    /**
     * Manual hotels have no provider record — expose the stored price as-is
     * (already marked up) with no live rooms and no provider call.
     *
     * @return array<string, mixed>
     */
    private function manualPayload(Hotel $hotel, int $nights): array
    {
        $result = $this->basePayload($hotel);
        $result['provider'] = 'manual';
        $result['available'] = true;
        $result['rooms'] = [];

        return array_merge($result, [
            'price' => (int) round((int) $hotel->price * $nights),
            'price_total' => (int) round((int) $hotel->price * $nights),
            'price_per_night' => (float) $hotel->price,
            'base_price' => $hotel->base_price,
            'currency' => $hotel->currency,
            'nights' => $nights,
        ]);
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
            'price_per_night' => $minRoom['price_per_night'] ?? $this->calculator->perNight($hotel->price, $hotel->min_nights ?? $nights),
            'base_price' => $minRoom['base_price'] ?? $hotel->base_price,
            'currency' => $minRoom['currency'] ?? $currency,
            'nights' => $nights,
        ];
    }

    /**
     * A room offer is bookable for a stay when it is not permanently
     * stop-reserved, its minimum stay fits the searched nights, and no
     * stop-sale range covers the exact dates. On-request rooms are still
     * bookable (they just need the hotel's confirmation), so `on_request` does
     * not block booking.
     *
     * @param  array<string, mixed>  $offer
     */
    private function roomBookable(array $offer, string $checkIn, string $checkOut): bool
    {
        if ($offer['stop_reservation'] || $offer['min_stay'] > $this->calculator->nightsBetween($checkIn, $checkOut)) {
            return false;
        }

        return ! $this->stopSalesOverlaps($offer['stop_sales'], $checkIn, $checkOut);
    }

    /**
     * @param  array{from: string, to: string}|null  $stopSales
     */
    private function stopSalesOverlaps(?array $stopSales, string $checkIn, string $checkOut): bool
    {
        if ($stopSales === null) {
            return false;
        }

        return Carbon::parse($checkIn)->lte(Carbon::parse($stopSales['to']))
            && Carbon::parse($checkOut)->gte(Carbon::parse($stopSales['from']));
    }

    /**
     * Hotel-wide no-availability ranges for the date picker: the days that fall
     * inside the stop-sale window of *every* non-stop-reserved room. If any
     * such room has no stop-sale (it is open every day) the list is empty, so a
     * single bookable room keeps every day selectable. Rooms under permanent
     * stop-reservation never contribute availability and are ignored.
     *
     * @param  list<array<string, mixed>>  $offers
     * @return list<array{from: string, to: string}>
     */
    private function hotelUnavailableRanges(array $offers): array
    {
        $windows = [];
        foreach ($offers as $offer) {
            if ($offer['stop_reservation']) {
                continue;
            }

            if ($offer['stop_sales'] === null) {
                return [];
            }

            $windows[] = $offer['stop_sales'];
        }

        if ($windows === []) {
            return [];
        }

        $intersection = array_shift($windows);
        foreach ($windows as $window) {
            $from = max($intersection['from'], $window['from']);
            $to = min($intersection['to'], $window['to']);
            if ($from > $to) {
                return [];
            }
            $intersection = ['from' => $from, 'to' => $to];
        }

        return [$intersection];
    }

    /**
     * Availability metadata for a hotel whose rooms are not bookable for a
     * window: why it is unavailable, the nearest day it becomes bookable again
     * (the earliest stop-sale end + 1 day, or the requested check-in when a
     * room is only blocked by its minimum stay), and its minimum stay.
     *
     * @param  list<array<string, mixed>>  $offers
     * @return array{reason: string|null, first_available_at: string|null, min_nights: int|null}
     */
    private function availabilityMeta(array $offers, string $checkIn, string $checkOut): array
    {
        $stays = [];
        $reopens = [];

        foreach ($offers as $offer) {
            if ($offer['stop_reservation']) {
                continue;
            }

            $stays[] = max(1, (int) $offer['min_stay']);

            if ($this->stopSalesOverlaps($offer['stop_sales'], $checkIn, $checkOut)) {
                $reopens[] = Carbon::parse($offer['stop_sales']['to'])->addDay()->toDateString();
            }
        }

        // Every room is permanently stop-reserved: no reopen info exists.
        if ($stays === []) {
            return ['reason' => 'stop_reservation', 'first_available_at' => null, 'min_nights' => null];
        }

        // No room overlaps a stop-sale: the rooms are open every day and the
        // only reason they are not bookable for the picked window is that its
        // length is shorter than the minimum stay. The hotel is available from
        // the requested check-in, just not for that many nights.
        $reason = $reopens === [] ? 'min_stay' : 'stop_sale';

        return [
            'reason' => $reason,
            'first_available_at' => $reopens === [] ? $checkIn : min($reopens),
            'min_nights' => (int) min($stays),
        ];
    }

    /**
     * Normalize a room's `StopSales` window ({@see `FromDate`/`ToDate`}).
     *
     * @return array{from: string, to: string}|null
     */
    private function normalizeStopSales(mixed $raw): ?array
    {
        if (! is_array($raw) || ! isset($raw['FromDate'], $raw['ToDate'])) {
            return null;
        }

        $from = $this->parseProviderDate((string) $raw['FromDate']);
        $to = $this->parseProviderDate((string) $raw['ToDate']);

        if ($from === null || $to === null) {
            return null;
        }

        return ['from' => $from, 'to' => $to];
    }

    /**
     * Parse a provider date that may arrive as `Y-m-d` (StopSales) or
     * `d-m-Y H:i` (CancellationPolicy). Returns `Y-m-d` or null.
     */
    private function parseProviderDate(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        foreach (['Y-m-d', 'd-m-Y', 'd-m-Y H:i'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);
            } catch (Throwable) {
                continue;
            }

            if ($date !== false) {
                return $date->toDateString();
            }
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Cheapest offer price from a list of room offers (already filtered for
     * bookability by the caller).
     *
     * @param  list<array<string, mixed>>  $offers
     */
    private function minOfferPrice(array $offers): ?float
    {
        $prices = array_map(fn (array $offer) => (float) $offer['price'], $offers);

        return $prices === [] ? null : (float) min($prices);
    }

    /**
     * Minimum stay across a list of room offers.
     *
     * @param  list<array<string, mixed>>  $offers
     */
    private function minStayOf(array $offers): ?int
    {
        $stays = array_map(fn (array $offer) => max(1, (int) $offer['min_stay']), $offers);

        return $stays === [] ? null : (int) min($stays);
    }

    /**
     * Throttle between provider calls.
     */
    private function throttle(int $throttleMs, int &$calls): void
    {
        if ($calls++ > 0 && $throttleMs > 0) {
            usleep($throttleMs * 1000);
        }
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
