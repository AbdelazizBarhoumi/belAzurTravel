<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OS-TRAVEL Hotel API
    |--------------------------------------------------------------------------
    |
    | Partner credentials and sync behavior for the OS-TRAVEL hotel catalog.
    | All provider calls happen server-side; credentials are never exposed
    | to the frontend. See docs/os-travel-integration-plan.md.
    |
    */

    'base_url' => env('OS_TRAVEL_BASE_URL', ''),

    'login' => env('OS_TRAVEL_LOGIN', ''),

    'password' => env('OS_TRAVEL_PASSWORD', ''),

    'timeout' => 30,

    'retry' => [
        'times' => 3,
        'sleep' => 100,
        'when' => [429, 500, 502, 503, 504],
    ],

    'markup' => [
        'default' => (int) env('OS_TRAVEL_MARKUP_DEFAULT', 20),
    ],

    'currency' => [
        'default' => env('OS_TRAVEL_CURRENCY_DEFAULT', 'TND'),
    ],

    'sync' => [
        // Empty = all countries returned by ListCountry. Otherwise, a list of
        // country Ids (strings) to sync.
        'countries' => [],

        // Delay between HotelDetail calls during a catalog sync.
        'throttle_ms' => (int) env('OS_TRAVEL_SYNC_THROTTLE_MS', 150),

        // Maximum number of pending hotels processed by a single bulk approval.
        'bulk_approve_max' => (int) env('OS_TRAVEL_BULK_APPROVE_MAX', 50),

        // How long a sync run's single-flight lock is held before it can be
        // overtaken (also used as the schedule's withoutOverlapping expiry).
        'lock_ttl_minutes' => (int) env('OS_TRAVEL_SYNC_LOCK_TTL_MINUTES', 180),

        // Scheduled cadence for `os-travel:sync-catalog`.
        'schedule' => [
            'interval' => 'daily',
            'at' => '02:00',
        ],
    ],

    'refresh' => [
        // Price-basis window for the browse-mode refresh. The stored price is
        // a live PER-NIGHT minimum, so a 1-night window is queried and the
        // provider total for it IS the per-night price (stored as-is, never
        // divided). Hotels the provider won't price for a 1-night stay are
        // reported as omitted and their stored price is cleared — browse
        // shows only genuine live per-night API values.
        'nights' => (int) env('OS_TRAVEL_REFRESH_NIGHTS', 1),

        // How long a manual refresh request's single-flight lock is held before
        // it can be overtaken (also used as the schedule's withoutOverlapping
        // expiry for `os-travel:process-refresh-request`).
        'lock_ttl_minutes' => (int) env('OS_TRAVEL_REFRESH_LOCK_TTL_MINUTES', 30),

        // When a hotel has no availability in the default window, the refresh
        // probes forward chronologically until the nearest window that returns
        // a price. The scan is two-phase: a coarse pass steps `step_days` apart
        // (default 7, so the whole ~42-day horizon costs few calls), then a fine
        // pass **binary-searches** the gap between the previous coarse check-in
        // and the winning one (O(log step_days) probes, chunked) so the reported
        // nearest available day is exact without scanning every day.
        'probe' => [
            'attempts' => (int) env('OS_TRAVEL_REFRESH_PROBE_ATTEMPTS', 6),
            'step_days' => (int) env('OS_TRAVEL_REFRESH_PROBE_STEP_DAYS', 7),

            // Stay lengths probed per check-in window, in ascending order, so
            // a hotel's minimum stay is detected exactly: 1 night first, then
            // 2, 3, ... up to the configured maximum. The provider's stay-total
            // for the first successful length is normalized to a per-night
            // display price (total ÷ nights); a 1-night total is stored as-is.
            'night_lengths' => [1, 2, 3, 4, 5, 6, 7],
        ],

        // Scheduled cadence for `os-travel:refresh-latest-prices`.
        'schedule' => [
            'interval' => 'everySixHours',
            'at' => null,
        ],
    ],

    'search' => [
        // Delay between multi-chunk HotelSearch calls. 0 in tests.
        'throttle_ms' => (int) env('OS_TRAVEL_SEARCH_THROTTLE_MS', 150),
    ],

];
