<?php

namespace App\Notifications\Concerns;

use Illuminate\Notifications\AnonymousNotifiable;

trait NotifiesByMail
{
    public function via(object $notifiable): array
    {
        // On-demand recipients (e.g. the commercial inbox) have no database row.
        if ($notifiable instanceof AnonymousNotifiable) {
            return $this->isMailConfigured() ? ['mail'] : [];
        }

        $channels = ['database'];
        if ($this->isMailConfigured()) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Mail is sent right after the HTTP response (`deferred`), so it never
     * waits for cron and never slows the page; a failure is retried from the
     * database queue. The in-app database notification is written immediately.
     *
     * @return array<string, string>
     */
    public function viaConnections(): array
    {
        return ['mail' => 'deferred', 'database' => 'sync'];
    }

    private function isMailConfigured(): bool
    {
        return config('mail.default') !== 'log'
            && ! empty(config('mail.mailers.smtp.host'))
            && config('mail.mailers.smtp.host') !== '127.0.0.1';
    }
}
