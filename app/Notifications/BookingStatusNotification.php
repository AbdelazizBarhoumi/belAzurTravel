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
            'fr' => "Votre reservation #{$this->booking->id} est {$this->statusLabel($status, 'fr')}",
            'ar' => "حجزك رقم {$this->booking->id} {$this->statusLabel($status, 'ar')}",
            'en' => "Your booking #{$this->booking->id} is {$this->statusLabel($status, 'en')}",
        ];
    }

    private function statusLabel(string $status, string $lang): string
    {
        return match ($status) {
            'Confirmed' => match ($lang) {
                'fr' => 'confirmee',
                'ar' => 'مؤكد',
                default => 'confirmed',
            },
            'Cancelled' => match ($lang) {
                'fr' => 'annulee',
                'ar' => 'ملغى',
                default => 'cancelled',
            },
            default => match ($lang) {
                'fr' => 'en attente',
                'ar' => 'قيد الانتظار',
                default => 'pending',
            },
        };
    }
}
