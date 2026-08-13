<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

$schedule = config('ostravel.sync.schedule', []);

Schedule::command('os-travel:sync-catalog')
    ->{($schedule['interval'] ?? 'daily').'At'}($schedule['at'] ?? '02:00')
    ->withoutOverlapping(config('ostravel.sync.lock_ttl_minutes'))
    ->onOneServer();
