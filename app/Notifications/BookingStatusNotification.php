<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingStatusNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Booking $booking) {}

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

        $subject = match ($status) {
            'Confirmed' => "Booking #{$this->booking->id} Confirmed",
            'Cancelled' => "Booking #{$this->booking->id} Cancelled",
            default => "Booking #{$this->booking->id} Status Update",
        };

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.payment-success', [
                'booking' => $this->booking,
                'payment' => $this->booking->payment,
                'greeting' => match ($status) {
                    'Confirmed' => 'Your Booking is Confirmed!',
                    'Cancelled' => 'Your Booking Has Been Cancelled',
                    default => 'Booking Status Update',
                },
                'headerSubtitle' => $subject,
                'introLine' => match ($status) {
                    'Confirmed' => "Great news! Your booking #{$this->booking->id} has been confirmed and payment received.",
                    'Cancelled' => "Your booking #{$this->booking->id} has been cancelled. If you believe this is an error, please contact support.",
                    default => "The status of your booking #{$this->booking->id} has been updated.",
                },
                'paymentDetailsLabel' => 'Payment Details',
                'bookingRefLabel' => 'Booking Reference',
                'transactionRefLabel' => 'Transaction Reference',
                'amountLabel' => 'Amount',
                'statusLabel' => 'Status',
                'paidLabel' => match ($status) {
                    'Confirmed' => 'Paid',
                    'Cancelled' => 'Refund Pending',
                    default => ucfirst($status),
                },
                'nextStepsLine' => match ($status) {
                    'Confirmed' => "You will receive your travel documents shortly. If you have any questions, don't hesitate to contact us.",
                    'Cancelled' => 'If you paid for this booking, a refund will be processed within 5-10 business days.',
                    default => 'If you have any questions about your booking, please contact our support team.',
                },
                'actionText' => 'View Booking',
                'actionUrl' => config('app.url').'/client/dashboard',
                'closingLine' => 'Thank you for choosing BelAzur Travel.',
            ]);
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
