<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Passport Encryption Key
    |--------------------------------------------------------------------------
    |
    | Dedicated key for passport data at rest (visa scans, passport numbers,
    | travellers' passport details). It is deliberately separate from APP_KEY.
    | Generate it with `php artisan passport:key` and back it up outside the
    | server: without it the stored passports cannot be decrypted.
    |
    */

    'key' => env('PASSPORT_KEY'),

    'cipher' => 'aes-256-gcm',

    // Private disk and folder for the encrypted scans.
    'disk' => 'local',
    'directory' => 'visa_passports',

];
