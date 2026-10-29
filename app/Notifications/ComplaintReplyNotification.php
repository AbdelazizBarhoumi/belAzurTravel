<?php

namespace App\Notifications;

use App\Models\Complaint;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ComplaintReplyNotification extends Notification implements ShouldQueue
{
    use NotifiesByMail;
    use Queueable;

    public bool $deleteWhenMissingModels = true;

    public function __construct(private readonly Complaint $complaint) {}


    public function toDatabase(object $notifiable): array
    {
        $isRefund = $this->complaint->type === 'refund_request';

        return [
            'type' => 'complaint.reply',
            'complaint_id' => $this->complaint->id,
            'complaint_type' => $this->complaint->type,
            'url' => $this->clientPath(),
            'fr' => $isRefund ? 'Réponse à votre demande de remboursement' : 'Réponse à votre réclamation',
            'ar' => $isRefund ? 'رد على طلب الاسترداد الخاص بك' : 'رد على شكواك',
            'en' => $isRefund ? 'Reply to your refund request' : 'Reply to your complaint',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $type = $this->complaint->type === 'refund_request' ? 'Refund Request' : 'Complaint';
        $replyMessage = $this->complaint->admin_reply[app()->getLocale()] ?? $this->complaint->admin_reply['en'] ?? '';

        return (new MailMessage)
            ->subject("Admin Reply - {$type} #{$this->complaint->id}")
            ->view('emails.complaint-reply', [
                'complaint' => $this->complaint,
                'replyMessage' => $replyMessage,
                'greeting' => "You've Received a Reply",
                'headerSubtitle' => "{$type} #{$this->complaint->id}",
                'introLine' => 'Our team has responded to your '.strtolower($type).'. Please review the reply below.',
                'adminReplyLabel' => 'Admin Reply',
                'refLabel' => 'Reference',
                'typeLabel' => 'Type',
                'statusLabel' => 'Status',
                'actionText' => 'View & Reply',
                'actionUrl' => config('app.url').$this->clientPath(),
                'closingLine' => 'You can reply to this message directly from your dashboard.',
            ]);
    }

    private function clientPath(): string
    {
        return $this->complaint->type === 'refund_request' ? '/client/refunds' : '/client/complaints';
    }
}
