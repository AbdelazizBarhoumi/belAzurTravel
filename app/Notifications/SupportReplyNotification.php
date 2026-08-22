<?php

namespace App\Notifications;

use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SupportReplyNotification extends Notification
{
    use NotifiesByMail;
    use Queueable;

    public function __construct(
        private readonly SupportInquiry $inquiry,
        private readonly User $author
    ) {}

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

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? app()->getLocale();

        $translate = fn (string $path, array $replace = []) => __("emails.{$path}", $replace, $locale);

        $replies = $this->inquiry->replies ?? [];
        $lastReply = ! empty($replies) ? end($replies) : [];
        $replyMessage = $lastReply['message'] ?? '';
        $inquirySubject = $this->localized($this->inquiry->subject, $locale);

        $subject = $translate('support.reply.subject');

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.support-reply', [
                'subject' => $subject,
                'headerSubtitle' => $subject,
                'greeting' => $translate('support.reply.greeting'),
                'introLine' => $translate('support.reply.intro'),
                'inquiryLabel' => $translate('support.reply.labels.inquiry'),
                'inquiryId' => $this->inquiry->id,
                'inquirySubject' => $inquirySubject,
                'supportTeamLabel' => $translate('support.reply.labels.support')." ({$this->author->name})",
                'replyMessage' => $replyMessage,
                'actionText' => $translate('action.view_details'),
                'actionUrl' => config('app.url').'/client/support',
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
