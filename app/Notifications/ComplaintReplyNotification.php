<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ComplaintReplyNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Complaint $complaint) {}

    public function via(object $notifiable): array
    {
        return ['database'];
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
}
