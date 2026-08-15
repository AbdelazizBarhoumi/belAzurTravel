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

            // Manual hotels (Stage 2) are always candidates with their stored
            // price — never sent to the provider. Provider-only filters (city
            // external id, category, boarding) don't apply to them. Hotels with
            // a published provider row are excluded regardless of the column so
            // a single hotel can never be returned twice.
            $manualHotels = Hotel::query()
                ->where('source', Hotel::SOURCE_MANUAL)
                ->whereNotIn('id', OsTravelHotel::query()
                    ->where('status', OsTravelHotel::PUBLISHED)
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
     * search for all published hotels, probing forward chronologically until
     * each hotel gets a price, and persists `last_price` / `last_price_at` on
     * `hotels` alongside the nearest available day (`first_available_at`) and
     * the minimum stay (`min_nights`) the price is normalized from. Hotels
     * with no live availability across the whole probe horizon have their
     * price cleared so browse never shows a stale or approximated value.
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
            ]);
            $updated++;
        }

        // No live price for this hotel anywhere in the probe horizon: clear
        // the stored browse price and its availability metadata so it is never
        // shown as stale.
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
            ]);
        }

        return ['updated' => $updated, 'omitted' => $probe['omitted']];
    }

    /**
     * Refresh the provider's minimum price for staged (pending/approved)
     * hotels and persist it as their `base_price`, so the admin can review
     * and approve without typing a price by hand. Probes forward
     * chronologically until each hotel gets a price, recording the nearest
     * available day and minimum stay. Hotels with no live availability across
     * the whole probe horizon have their `base_price` cleared so a stale or
     * approximated value is never staged. Optionally restrict to a set of
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
            // approved, published (so the live price can be synced without
            // unpublishing first), rejected, or orphaned — whatever the admin
            // is currently looking at.
            $query->whereIn('id', $ids);
        } else {
            $query->whereIn('status', [OsTravelHotel::PENDING, OsTravelHotel::APPROVED]);
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
                'last_price_attempt_at' => now(),
                'first_available_at' => $value['first_available_at'],
                'min_nights' => $value['min_nights'],
            ]);

            $this->syncPublishedHotel($item, (int) round($value['price']), $value['currency']);
            $updated++;
        }

        // No live price for this hotel anywhere in the probe horizon: clear
        // the staged price and its availability metadata so it is never shown
        // as stale.
        foreach ($probe['omitted_ids'] as $externalId) {
            $item = $staged->get($externalId);
            if ($item === null) {
                continue;
            }

            $item->update([
                'base_price' => null,
                'price_status' => OsTravelHotel::PRICE_NO_AVAILABILITY,
                'last_price_attempt_at' => now(),
                'first_available_at' => null,
                'min_nights' => null,
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
            'omitted' => count($probe['omitted_ids']),
            'omitted_ids' => $probe['omitted_ids'],
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
        ])->save();
    }

    /**
     * Query the provider for the minimum bookable per-night price of a set of
     * external ids, probing forward chronologically when a hotel has no
     * availability in the default window.
     *
     * The probe is two-phase so the reported nearest available day is exact
     * rather than coarse:
     *
     * 1. **Coarse phase** — steps forward in `step_days` increments (default 7)
     *    across `attempts` windows, so the first window that returns a price
     *    brackets the hotel's availability. Cheap enough to scan the whole
     *    ~42-day horizon without probing every single day.
     * 2. **Fine phase** — for each hotel priced at a stepped (attempt > 0)
     *    window, **binary-searches** the gap between the previous coarse
     *    check-in and the winning one (O(log step_days) ladder probes, chunked
     *    across hotels that share a midpoint), so the exact nearest available
     *    day is found even when it falls between two coarse check-ins — without
     *    paying the full ladder on every day of the gap. Hotels priced in the
     *    default window (attempt 0) are already at the earliest bookable day
     *    and need no refinement.
     *
     * The provider has no explicit minimum-stay field, so per check-in window
     * the probe walks a ladder of stay lengths in ascending order
     * (`ostravel.refresh.probe.night_lengths`, default 1 → 7) and takes the
     * first length that yields a price as the hotel's minimum stay. The
     * provider total for that length is the shortest bookable stay's total:
     * a 1-night total is already the per-night price and is stored as-is,
     * while a longer stay is normalized to a per-night display price
     * (total ÷ nights).
     *
     * A hotel is reported as omitted only when it is never returned by the
     * provider across any probed window or stay length; provider failures
     * abort probing for the affected chunk (no re-query) and are excluded
     * from `omitted_ids` because they are transient errors rather than a lack
     * of availability. A probe window past the provider's bookable horizon
     * ("CheckIn dépasser") is not a failure either: probing further forward
     * is pointless, so that chunk counts as omitted (no availability within
     * the horizon).
     *
     * @param  list<string>  $externalIds
     * @param  array<string, mixed>  $options
     * @return array{prices: array<string, array{price: float, currency: string, first_available_at: string, min_nights: int}>, omitted: int, omitted_ids: list<string>, failed_ids: list<string>}
     */
    private function probePrices(array $externalIds, array $options): array
    {
        // Eloquent keyBy() returns int keys for numeric external ids, but the
        // provider envelope always yields strings. Normalize once.
        $externalIds = array_values(array_map('strval', $externalIds));

        $attempts = max(1, (int) config('ostravel.refresh.probe.attempts', 6));
        $stepDays = max(1, (int) config('ostravel.refresh.probe.step_days', 7));

        $prices = [];
        $failedIds = [];
        $refineWindows = [];
        $remaining = $externalIds;
        $throttleMs = (int) config('ostravel.search.throttle_ms', 150);
        $calls = 0;

        $baseCheckIn = $options['check_in'] ?? Carbon::today()->addDay()->toDateString();

        // Phase 1 — coarse forward scan (default `step_days` apart).
        for ($attempt = 0; $attempt < $attempts && $remaining !== []; $attempt++) {
            $attemptCheckIn = Carbon::parse($baseCheckIn)->addDays($attempt * $stepDays)->toDateString();

            $pricedBefore = array_keys($prices);
            $remaining = $this->probeLadder($remaining, $attemptCheckIn, $options, $prices, $failedIds, $throttleMs, $calls);

            // A hotel first priced at a stepped (attempt > 0) window is only
            // known to be available somewhere inside the gap between the
            // previous coarse check-in and this one. Record the gap so the
            // fine phase can locate the exact day.
            if ($attempt > 0) {
                $prevCheckIn = Carbon::parse($baseCheckIn)->addDays(($attempt - 1) * $stepDays)->toDateString();

                foreach (array_values(array_diff(array_keys($prices), $pricedBefore)) as $externalId) {
                    $refineWindows[$externalId] = [
                        'from' => Carbon::parse($prevCheckIn)->addDay()->toDateString(),
                        'to' => $attemptCheckIn,
                    ];
                }
            }
        }

        // Phase 2 — refine each stepped gap to the exact nearest available day.
        if ($refineWindows !== []) {
            $this->refineNearestAvailableDays($refineWindows, $options, $prices, $throttleMs, $calls);
        }

        // A hotel is "omitted" (no availability) when it was probed across the
        // whole horizon but the provider never returned a price for it.
        // Transient provider failures are not omitted: keep their previous value.
        $omittedIds = array_values(array_diff(
            $externalIds,
            array_keys($prices),
            $failedIds,
        ));

        return [
            'prices' => $prices,
            'omitted' => count($omittedIds),
            'omitted_ids' => $omittedIds,
            'failed_ids' => $failedIds,
        ];
    }

    /**
     * Probe a single check-in window across the stay-length ladder for a set
     * of external ids. Hotels that get a price are recorded in `$prices` with
     * the given check-in as their nearest available day and the winning length
     * as their minimum stay; provider failures abort the affected chunk (no
     * re-query) and are reported via `$failedIds`.
     *
     * @param  list<string>  $externalIds
     * @param  array<string, array{price: float, currency: string, first_available_at: string, min_nights: int}>  $prices
     * @param  list<string>  $failedIds
     * @return list<string> ids still without a price after the whole ladder.
     */
    private function probeLadder(
        array $externalIds,
        string $checkIn,
        array $options,
        array &$prices,
        array &$failedIds,
        int $throttleMs,
        int &$calls,
    ): array {
        $remaining = $externalIds;
        $newlyPriced = [];

        foreach ($this->probeNightLengths() as $nightLength) {
            if ($remaining === []) {
                break;
            }

            $attemptOptions = $options;
            $attemptOptions['check_in'] = $checkIn;
            $attemptOptions['check_out'] = Carbon::parse($checkIn)->addDays($nightLength)->toDateString();

            $searchDetails = $this->searchDetails($attemptOptions);

            foreach (array_chunk($remaining, self::MAX_HOTELS_PER_REQUEST) as $chunk) {
                if ($calls++ > 0 && $throttleMs > 0) {
                    usleep($throttleMs * 1000);
                }

                try {
                    $envelope = $this->providerEnvelope($chunk, $searchDetails, $attemptOptions);
                } catch (OsTravelHorizonExceededException) {
                    // The probe window is past the provider's bookable
                    // horizon: this chunk has no live availability anywhere in
                    // the horizon, so it is omitted rather than a provider
                    // failure. Stop probing it (later windows are even further out).
                    $remaining = array_values(array_diff($remaining, $chunk));

                    continue;
                }
                if ($envelope === null) {
                    // Provider failure: abort probing this chunk (no re-query)
                    // and report it separately from "no availability".
                    $failedIds = array_merge($failedIds, $chunk);
                    $remaining = array_values(array_diff($remaining, $chunk));

                    continue;
                }

                foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                    $externalId = (string) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? '');

                    if (! in_array($externalId, $remaining, true)) {
                        continue;
                    }

                    $minPrice = $this->minRoomPrice($providerHotel);
                    if ($minPrice === null) {
                        continue;
                    }

                    // The provider total for the shortest bookable stay is
                    // normalized to a per-night display price: the 1-night
                    // total is already per-night and is stored as-is,
                    // while a longer stay total is divided by its length.
                    $prices[$externalId] = [
                        'price' => $nightLength === 1
                            ? round($minPrice, 2)
                            : round($minPrice / $nightLength, 2),
                        'currency' => $this->calculator->currency($providerHotel['Currency'] ?? null),
                        'first_available_at' => $checkIn,
                        'min_nights' => $nightLength,
                    ];
                    $newlyPriced[] = $externalId;
                }

                // Only hotels priced during THIS window leave the probe set; a
                // hotel that already holds a price from a previous window (e.g.
                // a coarse phase result being refined to an earlier exact day)
                // must keep being probed until a cheaper exact day is found. A
                // hotel that was returned but has no bookable room (e.g.
                // stop-sales) also
                // keeps being probed at longer stays and later windows.
                $remaining = array_values(array_diff($remaining, $newlyPriced));
            }
        }

        return $remaining;
    }

    /**
     * Phase 2 of the forward probe: a hotel priced at a coarse (stepped) window
     * is known to be available somewhere between the previous coarse check-in
     * and the winning one, but not on the previous coarse check-in itself.
     * Locate the exact nearest available day with a **binary search** over the
     * gap (O(log step_days) ladder probes per hotel, all hotels sharing a
     * midpoint probed in one chunk) instead of scanning every day.
     *
     * This assumes availability inside a gap is monotone — once a hotel is
     * bookable it stays bookable — the same assumption the coarse forward scan
     * already makes across windows. Under that model the first day the ladder
     * prices is the exact nearest available day. A fine-phase provider failure
     * only loses refinement precision, never the coarse price, so it is
     * ignored (the coarse result stands).
     *
     * @param  array<string, array{from: string, to: string}>  $windows
     * @param  array<string, mixed>  $options
     * @param  array<string, array{price: float, currency: string, first_available_at: string, min_nights: int}>  $prices
     */
    private function refineNearestAvailableDays(
        array $windows,
        array $options,
        array &$prices,
        int $throttleMs,
        int &$calls,
    ): void {
        $bounds = [];
        foreach ($windows as $externalId => $window) {
            $bounds[(string) $externalId] = [
                'lo' => $window['from'],
                'hi' => $window['to'],
            ];
        }

        $remaining = array_values(array_map('strval', array_keys($bounds)));
        $ignoredFailures = [];

        while ($remaining !== []) {
            $midpoints = [];
            foreach ($remaining as $externalId) {
                $lo = Carbon::parse($bounds[$externalId]['lo']);
                $hi = Carbon::parse($bounds[$externalId]['hi']);
                $mid = $lo->eq($hi)
                    ? $bounds[$externalId]['lo']
                    : $lo->addDays(intdiv($lo->diffInDays($hi), 2))->toDateString();
                $midpoints[$mid][] = $externalId;
            }

            foreach ($midpoints as $mid => $ids) {
                $this->probeLadder($ids, $mid, $options, $prices, $ignoredFailures, $throttleMs, $calls);

                foreach ($ids as $externalId) {
                    $bound = $bounds[$externalId];
                    // The winning probe overwrote this hotel's price with the
                    // midpoint as its first available day, so a priced midpoint
                    // means it is available at or before `mid` (search earlier);
                    // an unpriced one means it becomes available later.
                    $priced = ($prices[$externalId]['first_available_at'] ?? '') === $mid;

                    $bounds[$externalId] = $priced
                        ? ['lo' => $bound['lo'], 'hi' => Carbon::parse($mid)->subDay()->toDateString()]
                        : ['lo' => Carbon::parse($mid)->addDay()->toDateString(), 'hi' => $bound['hi']];
                }
            }

            // Continue only while a hotel's range can still shrink.
            $remaining = array_values(array_filter(
                $remaining,
                fn (string $externalId): bool => $bounds[$externalId]['lo'] <= $bounds[$externalId]['hi'],
            ));
        }
    }

    /**
     * Stay lengths probed per check-in window, in ascending order, so a
     * hotel's minimum stay is found exactly (1 night first, then 2, 3, ... up
     * to the configured maximum). The provider total for the first successful
     * length is normalized to a per-night display price.
     *
     * @return list<int>
     */
    private function probeNightLengths(): array
    {
        $lengths = config('ostravel.refresh.probe.night_lengths', [1, 2, 3, 4, 5, 6, 7]);

        if (! is_array($lengths) || $lengths === []) {
            return [1];
        }

        $lengths = array_values(array_unique(array_map('intval', $lengths)));
        sort($lengths);

        return $lengths;
    }

    /**
     * Probe a single date window for a set of external ids (no forward
     * scanning). Used by the admin list's live-check filter: the admin picks
     * dates and the list reports, for that exact window, which hotels have a
     * live price and which have no availability or a provider error.
     *
     * @param  list<string>  $externalIds
     * @return array{prices: array<string, array{price: float, currency: string}>, omitted_ids: list<string>, failed_ids: list<string>}
     */
    public function probeWindow(array $externalIds, string $checkIn, string $checkOut): array
    {
        $externalIds = array_values(array_map('strval', $externalIds));
        $throttleMs = (int) config('ostravel.search.throttle_ms', 150);

        $options = [
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'only_available' => true,
        ];
        $searchDetails = $this->searchDetails($options);

        $prices = [];
        $seenAll = [];
        $failedIds = [];
        $remaining = $externalIds;

        foreach (array_chunk($remaining, self::MAX_HOTELS_PER_REQUEST) as $index => $chunk) {
            if ($index > 0 && $throttleMs > 0) {
                usleep($throttleMs * 1000);
            }

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
                $seenAll[] = $externalId;

                $minPrice = $this->minRoomPrice($providerHotel);
                if ($minPrice === null) {
                    continue;
                }

                $prices[$externalId] = [
                    'price' => round($minPrice, 2),
                    'currency' => $this->calculator->currency($providerHotel['Currency'] ?? null),
                ];
            }
        }

        $omittedIds = array_values(array_diff(
            $externalIds,
            array_keys($prices),
            $failedIds,
        ));

        return [
            'prices' => $prices,
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
                        // View ids and the raw Supplement list are echoed to the
                        // provider during booking, so keep the provider shape.
                        'view_ids' => array_map('intval', $room['View'] ?? []),
                        'supplements' => $room['Supplement'] ?? [],
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
