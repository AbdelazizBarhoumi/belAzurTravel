<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RefundApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Complaint $complaint,
        private readonly Booking $booking,
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
        return [
            'type' => 'refund.approved',
            'complaint_id' => $this->complaint->id,
            'booking_id' => $this->booking->id,
            'refund_amount' => $this->complaint->refund_amount,
            'url' => '/client/complaints',
            'fr' => "Remboursement de {$this->complaint->refund_amount} TND approuvé pour la réservation #{$this->booking->id}",
            'ar' => "تم الموافقة على استرداد {$this->complaint->refund_amount} د.ت للحجز #{$this->booking->id}",
            'en' => "Refund of {$this->complaint->refund_amount} TND approved for booking #{$this->booking->id}",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Refund Approved - Booking #{$this->booking->id}")
            ->view('emails.complaint-resolved', [
                'complaint' => $this->complaint,
                'isResolved' => true,
                'greeting' => 'Your Refund Has Been Approved',
                'headerSubtitle' => "Refund for Booking #{$this->booking->id}",
                'introLine' => 'Your refund request has been approved. The refund will be processed to your original payment method within 5-10 business days.',
                'refLabel' => 'Reference',
                'typeLabel' => 'Type',
                'statusLabel' => 'Status',
                'refundAmountLabel' => 'Refund Amount',
                'actionText' => 'View Details',
                'actionUrl' => config('app.url').'/client/complaints',
                'closingLine' => 'If you have any questions about your refund, please contact our support team.',
            ]);
    }
}
