<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use Illuminate\Console\Command;

class ExpireBookings extends Command
{
    protected $signature = 'bookings:expire';

    protected $description = 'Move pending bookings past their offer TTL to expired';

    public function handle(): int
    {
        $expired = 0;

        Booking::query()
            ->where('status', BookingStatus::Pending->value)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get()
            ->each(function (Booking $booking) use (&$expired): void {
                if (! $booking->transitionTo(BookingStatus::Expired, notes: 'Auto-expired: offer TTL reached')) {
                    return;
                }

                $expired++;

                $this->notifyOperations($booking->refresh());
                $this->notifyClient($booking);
            });

        $this->info("Expired {$expired} pending booking(s).");

        return self::SUCCESS;
    }

    private function notifyOperations(Booking $booking): void
    {
        User::query()
            ->where('active', true)
            ->whereIn('role', ['admin'])
            ->get()
            ->each(function (User $recipient) use ($booking): void {
                $recipient->notify(new BookingActivityNotification($booking, 'booking.expired'));
            });
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
