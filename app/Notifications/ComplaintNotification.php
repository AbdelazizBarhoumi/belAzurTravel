<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ComplaintNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Complaint $complaint) {}

    public function via(object $notifiable): array
    {
        return ['database'];
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
}
