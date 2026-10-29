<?php

namespace App\Notifications;

use App\Models\Complaint;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ComplaintResolvedNotification extends Notification implements ShouldQueue
{
    use NotifiesByMail;
    use Queueable;

    public bool $deleteWhenMissingModels = true;

    public function __construct(
        private readonly Complaint $complaint,
        private readonly string $resolution,
    ) {}


    public function toDatabase(object $notifiable): array
    {
        $type = $this->complaint->type === 'refund_request' ? 'refund request' : 'complaint';

        return [
            'type' => 'complaint.resolved',
            'complaint_id' => $this->complaint->id,
            'complaint_type' => $this->complaint->type,
            'resolution' => $this->resolution,
            'url' => $this->clientPath(),
            'fr' => $this->resolution === 'resolved'
                ? "Votre {$type} #{$this->complaint->id} a été résolue"
                : "Votre {$type} #{$this->complaint->id} a été rejetée",
            'ar' => $this->resolution === 'resolved'
                ? "{$type} رقم #{$this->complaint->id} تم حلها"
                : "{$type} رقم #{$this->complaint->id} تم رفضها",
            'en' => $this->resolution === 'resolved'
                ? "Your {$type} #{$this->complaint->id} has been resolved"
                : "Your {$type} #{$this->complaint->id} has been rejected",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $type = $this->complaint->type === 'refund_request' ? 'Refund Request' : 'Complaint';
        $isResolved = $this->resolution === 'resolved';

        return (new MailMessage)
            ->subject(($isResolved ? 'Resolved' : 'Rejected')." - {$type} #{$this->complaint->id}")
            ->view('emails.complaint-resolved', [
                'complaint' => $this->complaint,
                'isResolved' => $isResolved,
                'greeting' => $isResolved ? "Your {$type} Has Been Resolved" : "Your {$type} Has Been Rejected",
                'headerSubtitle' => "{$type} #{$this->complaint->id}",
                'introLine' => $isResolved
                    ? "We've reviewed your ".strtolower($type).' and are pleased to inform you that it has been resolved.'
                    : "We've carefully reviewed your ".strtolower($type).' and unfortunately, we are unable to accommodate your request at this time.',
                'refLabel' => 'Reference',
                'typeLabel' => 'Type',
                'statusLabel' => 'Status',
                'refundAmountLabel' => 'Refund Amount',
                'actionText' => 'View Details',
                'actionUrl' => config('app.url').$this->clientPath(),
                'closingLine' => $isResolved
                    ? "If you have any further questions, please don't hesitate to contact us."
                    : 'If you believe this decision was made in error, please contact our support team for further assistance.',
            ]);
    }

    private function clientPath(): string
    {
        return $this->complaint->type === 'refund_request' ? '/client/refunds' : '/client/complaints';
    }
}
