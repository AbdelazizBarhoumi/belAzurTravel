<?php

use App\Models\SiteSetting;
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

Schedule::command('bookings:expire')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('send:trip-reminders')
    ->dailyAt('09:00')
    ->withoutOverlapping()
    ->onOneServer();

$digestTime = '08:00';
try {
    $digestTime = SiteSetting::query()->value('digest_time') ?: $digestTime;
} catch (Throwable) {
    // Database not available yet; fall back to the default digest time.
}

Schedule::command('send:admin-digest')
    ->dailyAt($digestTime)
    ->withoutOverlapping()
    ->onOneServer();
