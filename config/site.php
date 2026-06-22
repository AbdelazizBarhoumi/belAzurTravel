<?php

return [
    'company_name' => env('SITE_COMPANY_NAME', 'BelAzurTravel'),
    'email' => env('SITE_EMAIL', 'contact@belazurtravel.com'),
    'phone' => env('SITE_PHONE', '+216 23 777 771'),
    'whatsapp' => env('SITE_WHATSAPP', '21623777771'),
    'address' => env('SITE_ADDRESS', '123 Travel St, NY 10001'),
    'year' => env('SITE_YEAR', date('Y')),

    /*
    |--------------------------------------------------------------------------
    | Navigation Settings
    |--------------------------------------------------------------------------
    |
    | enabled_dropdowns: Which page keys have dropdown menus enabled.
    | This is controlled here in code, not via the UI.
    |
    */
    'navigation' => [
        'enabled_dropdowns' => [
            'destinations',
            'hotels',
            'tours',
            'deals',
            'gallery',
            'events',
            'blog',
            'cars',
            'flights',
        ],
    ],
];
