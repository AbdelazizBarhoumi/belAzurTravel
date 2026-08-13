<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('os-travel:sync-catalog')
    ->dailyAt('02:00')
    ->withoutOverlapping(config('ostravel.sync.lock_ttl_minutes'))
    ->onOneServer();
