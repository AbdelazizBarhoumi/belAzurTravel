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

$refreshSchedule = config('ostravel.refresh.schedule', []);
$refreshMethod = $refreshSchedule['interval'] ?? 'everySixHours';
$refreshAt = $refreshSchedule['at'] ?? null;
$refreshCommand = Schedule::command('os-travel:refresh-latest-prices');

if ($refreshAt !== null && $refreshAt !== '') {
    $refreshCommand->{$refreshMethod.'At'}($refreshAt);
} else {
    $refreshCommand->{$refreshMethod}();
}

$refreshCommand->withoutOverlapping()->onOneServer();

Schedule::command('os-travel:process-refresh-request')
    ->everyMinute()
    ->withoutOverlapping(config('ostravel.refresh.lock_ttl_minutes'))
    ->onOneServer();
