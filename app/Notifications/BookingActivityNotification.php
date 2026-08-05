<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
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
        $channels = ['database'];
        if ($this->isMailConfigured()) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    private function isMailConfigured(): bool
    {
        return config('mail.default') !== 'log'
            && ! empty(config('mail.mailers.smtp.host'))
            && config('mail.mailers.smtp.host') !== '127.0.0.1';
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

    public function toMail(object $notifiable): MailMessage
    {
        $client = $this->booking->client['name'] ?? $this->booking->client['email'] ?? 'Client';
        $locale = $notifiable->preferred_language ?? app()->getLocale();

        $subject = match ($this->activityType) {
            'booking.paid' => "New Payment - Booking #{$this->booking->id}",
            'booking.cancelled' => "Booking Cancelled - #{$this->booking->id}",
            'booking.confirmed' => "Booking Confirmed - #{$this->booking->id}",
            default => "New Booking #{$this->booking->id} from {$client}",
        };

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.booking-created', [
                'booking' => $this->booking,
                'greeting' => match ($this->activityType) {
                    'booking.paid' => 'Payment Received!',
                    'booking.cancelled' => 'Booking Cancelled',
                    'booking.confirmed' => 'Booking Confirmed',
                    default => 'New Booking Received',
                },
                'headerSubtitle' => $subject,
                'introLine' => match ($this->activityType) {
                    'booking.paid' => "A payment has been received for booking #{$this->booking->id}.",
                    'booking.cancelled' => "Booking #{$this->booking->id} has been cancelled.",
                    'booking.confirmed' => "Booking #{$this->booking->id} has been confirmed.",
                    default => "A new booking has been submitted by {$client}.",
                },
                'bookingLabel' => 'Booking Details',
                'refLabel' => 'Reference',
                'typeLabel' => 'Type',
                'datesLabel' => 'Dates',
                'amountLabel' => 'Amount',
                'statusLabel' => 'Status',
                'actionText' => 'View Booking',
                'actionUrl' => config('app.url').'/admin/bookings',
                'closingLine' => 'This is an automated notification from BelAzur Travel.',
            ]);
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
