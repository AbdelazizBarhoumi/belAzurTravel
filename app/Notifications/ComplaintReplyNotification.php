<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ComplaintReplyNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Complaint $complaint) {}

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
        $type = $this->complaint->type === 'refund_request' ? 'refund request' : 'complaint';

        return [
            'type' => 'complaint.reply',
            'complaint_id' => $this->complaint->id,
            'complaint_type' => $this->complaint->type,
            'url' => '/client/complaints',
            'fr' => "Réponse à votre {$type}",
            'ar' => "رد على {$type} الخاصة بك",
            'en' => "Reply to your {$type}",
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
                'introLine' => "Our team has responded to your ".strtolower($type).". Please review the reply below.",
                'adminReplyLabel' => 'Admin Reply',
                'refLabel' => 'Reference',
                'typeLabel' => 'Type',
                'statusLabel' => 'Status',
                'actionText' => 'View & Reply',
                'actionUrl' => config('app.url')."/client/complaints",
                'closingLine' => "You can reply to this message directly from your dashboard.",
            ]);
    }
}
