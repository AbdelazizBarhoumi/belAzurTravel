<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingActivityNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Booking $booking,
        private readonly string $activityType,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $client = $this->booking->client['name'] ?? $this->booking->client['email'] ?? 'Client';

        return [
            'type' => $this->activityType,
            'booking_id' => $this->booking->id,
            'url' => '/admin/bookings/'.$this->booking->id,
            'fr' => $this->message($client, 'fr'),
            'ar' => $this->message($client, 'ar'),
            'en' => $this->message($client, 'en'),
        ];
    }

    private function message(string $client, string $lang): string
    {
        return match ($this->activityType) {
            'booking.cancelled' => __('messages.booking_cancelled_by', ['client' => $client], $lang),
            'booking.confirmed' => __('messages.booking_confirmed_for', ['client' => $client], $lang),
            default => __('messages.booking_created', ['client' => $client], $lang),
        };
    }
}
