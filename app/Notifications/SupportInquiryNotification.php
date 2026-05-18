<?php

namespace App\Notifications;

use App\Models\SupportInquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SupportInquiryNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly SupportInquiry $inquiry)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $client = $this->inquiry->client['name'] ?? $this->inquiry->client['email'] ?? 'Client';

        return [
            'type' => 'message.new',
            'inquiry_id' => $this->inquiry->id,
            'url' => '/assistant/messages',
            'fr' => "Nouveau message support de {$client}",
            'ar' => "رسالة دعم جديدة من {$client}",
            'en' => "New support message from {$client}",
        ];
    }
}
