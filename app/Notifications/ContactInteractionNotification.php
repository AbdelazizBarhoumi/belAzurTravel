<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContactInteractionNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $type,
        private readonly ?User $user,
        private readonly ?string $page,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(mixed $notifiable): array
    {
        $clientName = $this->user ? ($this->user->name ?? $this->user->email) : 'Guest';
        $interaction = ucfirst($this->type); // Call or Whatsapp

        return [
            'type' => 'interaction.contact',
            'interaction_type' => $this->type,
            'user_id' => $this->user?->id,
            'page' => $this->page,
            'url' => $this->page,
            'en' => "{$clientName} clicked {$interaction} on page: {$this->page}",
            'fr' => "{$clientName} a cliqué sur {$interaction} sur la page: {$this->page}",
            'ar' => "نقر {$clientName} على {$interaction} في الصفحة: {$this->page}",
        ];
    }
}
