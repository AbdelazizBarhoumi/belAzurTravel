<?php

namespace App\Notifications;

use App\Models\SupportInquiry;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SupportReplyNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly SupportInquiry $inquiry,
        private readonly User $author
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $authorName = $this->author->name;

        return [
            'type' => 'message.reply',
            'inquiry_id' => $this->inquiry->id,
            'url' => '/client/dashboard', // Client dashboard has a support tab
            'fr' => "Nouveau message de {$authorName} concernant votre demande",
            'ar' => "رسالة جديدة من {$authorName} بخصوص طلبك",
            'en' => "New message from {$authorName} regarding your inquiry",
        ];
    }
}
