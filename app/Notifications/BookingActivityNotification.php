<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingActivityNotification extends Notification
{
    use NotifiesByMail;
    use Queueable;

    public function __construct(
        private readonly Booking $booking,
        private readonly string $activityType,
    ) {}

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

        $translate = fn (string $path, array $replace = []) => __("emails.{$path}", $replace, $locale);

        $group = match ($this->activityType) {
            'booking.paid' => 'admin_booking.paid',
            'booking.cancelled' => 'admin_booking.cancelled',
            'booking.confirmed' => 'admin_booking.confirmed',
            'booking.approved' => 'admin_booking.approved',
            'booking.rejected' => 'admin_booking.rejected',
            'booking.expired' => 'admin_booking.expired',
            default => 'admin_booking.created',
        };

        $view = match ($this->activityType) {
            'booking.cancelled' => 'emails.booking-cancelled',
            'booking.rejected' => 'emails.booking-rejected',
            'booking.expired' => 'emails.booking-expired',
            'booking.confirmed', 'booking.approved', 'booking.paid' => 'emails.booking-approved',
            default => 'emails.booking-created',
        };

        $subject = $translate("{$group}.subject", ['id' => $this->booking->booking_ref, 'client' => $client]);

        $data = [
            'booking' => $this->booking,
            'subject' => $subject,
            'headerSubtitle' => $subject,
            'greeting' => $translate("{$group}.greeting"),
            'introLine' => $translate("{$group}.intro", ['id' => $this->booking->booking_ref, 'client' => $client]),
            'bookingLabel' => $translate('admin_booking.labels.details'),
            'clientLabel' => $translate('admin_booking.labels.client'),
            'refLabel' => $translate('admin_booking.labels.ref'),
            'typeLabel' => $translate('admin_booking.labels.type'),
            'datesLabel' => $translate('admin_booking.labels.dates'),
            'amountLabel' => $translate('admin_booking.labels.amount'),
            'statusLabel' => $translate('admin_booking.labels.status'),
            'providerRefLabel' => $translate('booking.labels.provider_ref'),
            'actionText' => $translate('action.view_booking'),
            'actionUrl' => config('app.url').'/admin/bookings',
            'closingLine' => $translate('footer_automatic'),
        ];

        if ($this->activityType === 'booking.rejected') {
            $data['reasonLabel'] = $translate('admin_booking.labels.reason');
        }

        return (new MailMessage)
            ->subject($subject)
            ->view($view, $data);
    }

    private function message(string $client, string $lang): string
    {
        return match ($this->activityType) {
            'booking.cancelled' => __('messages.booking_cancelled_by', ['client' => $client], $lang),
            'booking.confirmed' => __('messages.booking_confirmed_for', ['client' => $client], $lang),
            'booking.approved' => __('messages.booking_approved_for', ['client' => $client], $lang),
            'booking.rejected' => __('messages.booking_rejected_for', ['client' => $client], $lang),
            'booking.expired' => __('messages.booking_expired_for', ['client' => $client], $lang),
            default => __('messages.booking_created', ['client' => $client], $lang),
        };
    }
}
