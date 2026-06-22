<?php

return [
    'clictopay' => [
        'username' => env('CLICTOPAY_USERNAME'),
        'password' => env('CLICTOPAY_PASSWORD'),
        'base_url' => env('CLICTOPAY_BASE_URL', 'https://test.clictopay.com/payment/rest'),
        'currency' => 788, // TND (ISO 4217)
    ],
];
