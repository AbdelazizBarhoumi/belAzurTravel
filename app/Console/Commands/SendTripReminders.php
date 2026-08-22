<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\SiteSetting;
use App\Models\User;
use App\Notifications\TripReminderNotification;
use Illuminate\Console\Command;

class SendTripReminders extends Command
{
    protected $signature = 'send:trip-reminders';

    protected $description = 'Email clients whose confirmed trip starts in trip_reminder_days';

    public function handle(): int
    {
        $days = (int) (SiteSetting::first()?->trip_reminder_days ?? 3);

        if ($days <= 0) {
            $this->info('Trip reminders disabled (trip_reminder_days <= 0).');

            return self::SUCCESS;
        }

        $targetDate = now()->addDays($days)->toDateString();

        $sent = 0;

        Booking::query()
            ->where('status', BookingStatus::Confirmed->value)
            ->whereDate('start_date', $targetDate)
            ->whereNotNull('user_id')
            ->get()
            ->each(function (Booking $booking) use ($days, &$sent): void {
                $user = User::query()->find($booking->user_id);

                if (! $user) {
                    return;
                }

                $user->notify(new TripReminderNotification($booking, $days));
                $sent++;
            });

        $this->info("Sent {$sent} trip reminder(s) for {$targetDate}.");

        return self::SUCCESS;
    }
}
