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

];
