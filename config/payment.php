<?php

return [
    // Online card payment is off until a ClictoPay merchant account exists;
    // bookings stay pending and the team arranges payment with the client.
    'online_enabled' => (bool) env('PAYMENT_ONLINE_ENABLED', false),

    'clictopay' => [
        'username' => env('CLICTOPAY_USERNAME'),
        'password' => env('CLICTOPAY_PASSWORD'),
        'base_url' => env('CLICTOPAY_BASE_URL', 'https://test.clictopay.com/payment/rest'),
        'currency' => 788, // TND (ISO 4217)
    ],
];
