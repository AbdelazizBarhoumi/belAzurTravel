<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingStatusNotification extends Notification
{
    use NotifiesByMail;
    use Queueable;

    public function __construct(private readonly Booking $booking) {}

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

    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->booking->status;
        $locale = $notifiable->preferred_language ?? app()->getLocale();

        $translate = fn (string $path, array $replace = []) => __("emails.{$path}", $replace, $locale);

        $group = match ($status) {
            'Approved' => 'booking.approved_pending',
            'Rejected' => 'booking.rejected',
            'Expired' => 'booking.expired',
            'Cancelled' => 'booking.cancelled',
            default => 'booking.approved',
        };

        $view = match ($status) {
            'Rejected' => 'emails.booking-rejected',
            'Expired' => 'emails.booking-expired',
            'Cancelled' => 'emails.booking-cancelled',
            default => 'emails.booking-approved',
        };

        $subject = $translate("{$group}.subject", ['id' => $this->booking->booking_ref]);

        $data = [
            'booking' => $this->booking,
            'subject' => $subject,
            'headerSubtitle' => $subject,
            'greeting' => $translate("{$group}.greeting"),
            'introLine' => $translate("{$group}.intro", ['id' => $this->booking->booking_ref]),
            'nextStepsLine' => $translate("{$group}.next_steps"),
            'bookingLabel' => $translate('booking.labels.details'),
            'refLabel' => $translate('booking.labels.ref'),
            'typeLabel' => $translate('booking.labels.type'),
            'itemLabel' => $translate('booking.labels.item'),
            'datesLabel' => $translate('booking.labels.dates'),
            'amountLabel' => $translate('booking.labels.amount'),
            'statusLabel' => $translate('booking.labels.status'),
            'providerRefLabel' => $translate('booking.labels.provider_ref'),
            'actionText' => $translate('action.view_booking'),
            'actionUrl' => config('app.url').'/client/dashboard',
            'closingLine' => $translate('footer_automatic'),
        ];

        if ($status === 'Rejected') {
            $data['reasonLabel'] = $translate('booking.labels.reason');
        }

        if ($status === 'Cancelled') {
            $data['penaltyLine'] = $translate('booking.cancelled.penalty');
        }

        return (new MailMessage)
            ->subject($subject)
            ->view($view, $data);
    }

    private function message(string $status, string $lang): string
    {
        $statusKey = match ($status) {
            'Confirmed' => 'messages.status_confirmed',
            'Approved' => 'messages.status_approved',
            'Rejected' => 'messages.status_rejected',
            'Expired' => 'messages.status_expired',
            'Cancelled' => 'messages.status_cancelled',
            default => 'messages.status_pending',
        };

        $text = __('messages.booking_status_changed', [
            'id' => $this->booking->booking_ref,
            'status' => __($statusKey, [], $lang),
        ], $lang);

        if ($status === 'Rejected' && $this->booking->reject_reason) {
            $text .= ' — '.__('messages.reject_reason', [], $lang).': '.$this->booking->reject_reason;
        }

        return $text;
    }
}
