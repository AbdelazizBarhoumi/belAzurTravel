<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TripReminderNotification extends Notification
{
    use NotifiesByMail;
    use Queueable;

    public function __construct(
        private readonly Booking $booking,
        private readonly int $daysUntil,
    ) {}

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'trip.reminder',
            'booking_id' => $this->booking->id,
            'url' => '/client/bookings/'.$this->booking->id,
            'fr' => "Votre voyage commence dans {$this->daysUntil} jour(s) - réservation #".($this->booking->booking_ref ?: $this->booking->id),
            'ar' => "تبدأ رحلتك خلال {$this->daysUntil} يوم - الحجز #".($this->booking->booking_ref ?: $this->booking->id),
            'en' => "Your trip starts in {$this->daysUntil} day(s) - booking #".($this->booking->booking_ref ?: $this->booking->id),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? app()->getLocale();

        $translate = fn (string $path, array $replace = []) => __("emails.{$path}", $replace, $locale);

        $start = $this->booking->start_date;
        $subject = $translate('trip_reminder.subject', ['days' => $this->daysUntil]);

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.trip-reminder', [
                'booking' => $this->booking,
                'subject' => $subject,
                'headerSubtitle' => $subject,
                'greeting' => $translate('trip_reminder.greeting'),
                'introLine' => $translate('trip_reminder.intro', [
                    'id' => $this->booking->booking_ref ?: $this->booking->id,
                    'date' => $start ? $start->format('d M Y') : '-',
                ]),
                'nextStepsLine' => $translate('trip_reminder.next_steps'),
                'bookingLabel' => $translate('booking.labels.details'),
                'refLabel' => $translate('booking.labels.ref'),
                'typeLabel' => $translate('booking.labels.type'),
                'itemLabel' => $translate('booking.labels.item'),
                'datesLabel' => $translate('booking.labels.dates'),
                'amountLabel' => $translate('booking.labels.amount'),
                'statusLabel' => $translate('booking.labels.status'),
                'actionText' => $translate('action.view_booking'),
                'actionUrl' => config('app.url').'/client/dashboard',
                'closingLine' => $translate('footer_automatic'),
            ]);
    }
}
