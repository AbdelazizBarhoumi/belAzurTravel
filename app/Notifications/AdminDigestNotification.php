<?php

namespace App\Notifications;

use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminDigestNotification extends Notification
{
    use NotifiesByMail;
    use Queueable;

    /**
     * @param  array<int, array{label: string, items: array<int, array{title: string, url?: string}>}>  $sections
     */
    public function __construct(
        private readonly array $sections,
        private readonly string $dateLabel = '',
    ) {}

    public function toDatabase(object $notifiable): array
    {
        $total = collect($this->sections)->sum(fn (array $section) => count($section['items'] ?? []));

        return [
            'type' => 'digest.daily',
            'url' => '/admin/dashboard',
            'fr' => "Résumé quotidien : {$total} élément(s)",
            'ar' => "الملخص اليومي: {$total} عنصر",
            'en' => "Daily digest: {$total} item(s)",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? app()->getLocale();

        $translate = fn (string $path, array $replace = []) => __("emails.{$path}", $replace, $locale);

        $subject = $translate('digest.subject');

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.admin-digest', [
                'subject' => $subject,
                'headerSubtitle' => $subject,
                'greeting' => $translate('digest.greeting'),
                'introLine' => $translate('digest.intro', ['date' => $this->dateLabel]),
                'emptyLine' => $translate('digest.empty'),
                'sections' => $this->sections,
                'actionText' => $translate('action.open_dashboard'),
                'actionUrl' => config('app.url').'/admin/dashboard',
                'closingLine' => $translate('footer_automatic'),
            ]);
    }
}
