<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingStatusNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Booking $booking) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $status = $this->booking->status;

        return [
            'type' => 'booking.status_changed',
            'booking_id' => $this->booking->id,
            'url' => '/client/bookings/'.$this->booking->id,
            'fr' => $this->message($status, 'fr'),
            'ar' => $this->message($status, 'ar'),
            'en' => $this->message($status, 'en'),
        ];
    }

    private function message(string $status, string $lang): string
    {
        $statusKey = match ($status) {
            'Confirmed' => 'messages.status_confirmed',
            'Cancelled' => 'messages.status_cancelled',
            default => 'messages.status_pending',
        };

        return __('messages.booking_status_changed', [
            'id' => $this->booking->id,
            'status' => __($statusKey, [], $lang),
        ], $lang);
    }
}
