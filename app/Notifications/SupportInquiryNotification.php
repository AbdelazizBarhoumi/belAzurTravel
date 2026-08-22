<?php

namespace App\Notifications;

use App\Models\SupportInquiry;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SupportInquiryNotification extends Notification
{
    use NotifiesByMail;
    use Queueable;

    public function __construct(private readonly SupportInquiry $inquiry) {}

    public function toDatabase(object $notifiable): array
    {
        $client = $this->inquiry->client['name'] ?? $this->inquiry->client['email'] ?? 'Client';

        return [
            'type' => 'message.new',
            'inquiry_id' => $this->inquiry->id,
            'url' => '/admin/notifications',
            'fr' => "Nouveau message support de {$client}",
            'ar' => "رسالة دعم جديدة من {$client}",
            'en' => "New support message from {$client}",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? app()->getLocale();

        $translate = fn (string $path, array $replace = []) => __("emails.{$path}", $replace, $locale);

        $clientName = $this->inquiry->client['name'] ?? $this->inquiry->client['email'] ?? 'Client';
        $clientEmail = $this->inquiry->client['email'] ?? '';
        $subjectText = $this->localized($this->inquiry->subject, $locale);
        $messageText = $this->localized($this->inquiry->message, $locale);

        $subject = $translate('support.inquiry.subject', ['client' => $clientName]);

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.support-inquiry', [
                'subject' => $subject,
                'headerSubtitle' => $subject,
                'greeting' => $translate('support.inquiry.greeting'),
                'introLine' => $translate('support.inquiry.intro', ['client' => $clientName]),
                'contactLabel' => $translate('support.inquiry.labels.contact'),
                'subjectLabel' => $translate('support.inquiry.labels.type'),
                'messageLabel' => $translate('support.inquiry.labels.message'),
                'clientName' => $clientName,
                'clientEmail' => $clientEmail,
                'subjectText' => $subjectText,
                'messageText' => $messageText,
                'actionText' => $translate('action.review'),
                'actionUrl' => config('app.url').'/admin/queue',
                'closingLine' => $translate('footer_automatic'),
            ]);
    }

    private function localized(?array $value, string $locale): string
    {
        if (is_string($value)) {
            return $value;
        }

        return $value[$locale] ?? $value['en'] ?? '';
    }
}
