<?php

use App\Models\SiteSetting;
use App\Support\ScheduleWindow;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| The production host (OVH shared hosting) only allows a cron as often as
| once an hour, at a minute we don't control. Exact-minute schedules such as
| dailyAt('09:00') or everyFiveMinutes() would silently never match, so every
| task is evaluated on each `schedule:run` and gated by ScheduleWindow:
|
|   - daily(H:MM) runs once per day, on the first tick at or after H:MM;
|   - every(N minutes) runs at most once per N-minute window.
|
| This works the same with an hourly cron and with a per-minute cron.
*/

$sync = config('ostravel.sync.schedule', []);

Schedule::command('os-travel:sync-catalog')
    ->everyMinute()
    ->when(ScheduleWindow::daily('os-travel:sync-catalog', $sync['at'] ?? '02:00'))
    ->withoutOverlapping(config('ostravel.sync.lock_ttl_minutes'))
    ->onOneServer();

Schedule::command('hotels:fetch-tomorrow-prices')
    ->everyMinute()
    ->when(ScheduleWindow::daily('hotels:fetch-tomorrow-prices', '03:00'))
    ->withoutOverlapping()
    ->onOneServer();

// Every 5 minutes with a per-minute cron; on each tick with an hourly cron.
Schedule::command('bookings:expire')
    ->everyMinute()
    ->when(ScheduleWindow::every('bookings:expire', 5))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('send:trip-reminders')
    ->everyMinute()
    ->when(ScheduleWindow::daily('send:trip-reminders', '09:00'))
    ->withoutOverlapping()
    ->onOneServer();

$digestTime = '08:00';
try {
    $digestTime = SiteSetting::query()->value('digest_time') ?: $digestTime;
} catch (Throwable) {
    // Database not available yet; fall back to the default digest time.
}

Schedule::command('send:admin-digest')
    ->everyMinute()
    ->when(ScheduleWindow::daily('send:admin-digest', $digestTime))
    ->withoutOverlapping()
    ->onOneServer();

// Emails are sent right after the HTTP response (`deferred` connection), so
// they never wait for cron. This only drains jobs left on the database queue
// (e.g. mail from scheduled commands or retries).
Schedule::command('queue:work database --stop-when-empty --tries=4 --backoff=1800 --max-time=50')
    ->everyMinute()
    // A killed worker must not hold the lock for the default 24 hours.
    ->withoutOverlapping(5)
    ->onOneServer();
