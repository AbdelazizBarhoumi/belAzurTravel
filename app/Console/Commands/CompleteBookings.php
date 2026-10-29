<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingStatusNotification;
use Illuminate\Console\Command;

class CompleteBookings extends Command
{
    protected $signature = 'bookings:complete';

    protected $description = 'Move confirmed bookings whose trip has ended to completed';

    public function handle(): int
    {
        $completed = 0;

        Booking::query()
            ->where('status', BookingStatus::Confirmed->value)
            ->where(function ($query): void {
                $query
                    ->where(function ($inner): void {
                        $inner->whereNotNull('end_date')
                            ->whereDate('end_date', '<', today());
                    })
                    ->orWhere(function ($inner): void {
                        $inner->whereNull('end_date')
                            ->whereNotNull('start_date')
                            ->whereDate('start_date', '<', today());
                    });
            })
            ->get()
            ->each(function (Booking $booking) use (&$completed): void {
                if (! $booking->transitionTo(BookingStatus::Completed, notes: 'Auto-completed: trip ended')) {
                    return;
                }

                $completed++;

                $this->notifyClient($booking->refresh());
            });

        $this->info("Completed {$completed} confirmed booking(s).");

        return self::SUCCESS;
    }

    private function notifyClient(Booking $booking): void
    {
        if (! $booking->user_id) {
            return;
        }

        $user = User::query()->find($booking->user_id);
        if ($user) {
            $user->notify(new BookingStatusNotification($booking));
        }
    }
}
