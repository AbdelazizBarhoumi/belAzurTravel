<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ComplaintNotification extends Notification
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
        $client = $this->complaint->user->name ?? 'Client';
        $type = $this->complaint->type === 'refund_request' ? 'refund request' : 'complaint';

        return [
            'type' => 'complaint.new',
            'complaint_id' => $this->complaint->id,
            'complaint_type' => $this->complaint->type,
            'url' => '/admin/complaints',
            'fr' => "Nouvelle {$type} de {$client}",
            'ar' => "{$type} جديدة من {$client}",
            'en' => "New {$type} from {$client}",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $type = $this->complaint->type === 'refund_request' ? 'Refund Request' : 'Complaint';

        return (new MailMessage)
            ->subject("New {$type} #{$this->complaint->id}")
            ->view('emails.complaint-created', [
                'complaint' => $this->complaint->load('booking:id,booking_ref'),
                'greeting' => "New {$type} Received",
                'headerSubtitle' => "{$type} #{$this->complaint->id}",
                'introLine' => 'A new '.strtolower($type).' has been submitted and requires your attention.',
                'complaintLabel' => "{$type} Details",
                'refLabel' => 'Reference',
                'typeLabel' => 'Type',
                'subjectLabel' => 'Subject',
                'bookingRefLabel' => 'Booking Reference',
                'actionText' => "Review {$type}",
                'actionUrl' => config('app.url').'/admin/complaints',
                'closingLine' => 'Please review and respond to this '.strtolower($type).' as soon as possible.',
            ]);
    }
}
