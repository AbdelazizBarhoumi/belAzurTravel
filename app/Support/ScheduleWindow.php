<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Schedule gates that don't depend on the cron firing at an exact minute.
 *
 * Each gate claims its window with Cache::add (atomic "set if absent"), so a
 * task runs once per window no matter how often — or how rarely — the
 * scheduler is triggered.
 */
class ScheduleWindow
{
    /**
     * Once per day, on the first scheduler tick at or after `$time` (H:MM).
     */
    public static function daily(string $task, string $time): Closure
    {
        return function () use ($task, $time): bool {
            [$hour, $minute] = array_map('intval', explode(':', $time) + [1 => 0]);
            $now = now();

            if ($now->lt($now->copy()->setTime($hour, $minute))) {
                return false;
            }

            return Cache::add("schedule-window:{$task}:".$now->toDateString(), true, now()->endOfDay());
        };
    }

    /**
     * At most once per `$minutes`-minute window.
     */
    public static function every(string $task, int $minutes): Closure
    {
        return function () use ($task, $minutes): bool {
            $window = intdiv(now()->timestamp, $minutes * 60);

            return Cache::add("schedule-window:{$task}:{$window}", true, $minutes * 60);
        };
    }
}
