<?php

namespace App\Notifications;

use App\Models\VisaApplication;
use App\Notifications\Concerns\NotifiesByMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * A new visa application: the full file (with the passport copy attached) for
 * the commercial team, or a receipt for the applicant.
 */
class VisaApplicationNotification extends Notification implements ShouldQueue
{
    use NotifiesByMail;
    use Queueable;

    public const FOR_TEAM = 'team';

    public const FOR_APPLICANT = 'applicant';

    public function __construct(
        private readonly VisaApplication $application,
        private readonly string $audience = self::FOR_TEAM,
        private readonly string $language = 'fr',
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        $application = $this->application->loadMissing('visa');
        $t = fn (string $key, array $replace = []) => __("emails.visa.{$key}", $replace, $this->language);

        $country = $application->visa?->name[$this->language]
            ?? $application->visa?->name['fr']
            ?? $application->visa?->code
            ?? '-';
        $applicant = trim($application->first_name.' '.$application->last_name);
        $group = $this->audience === self::FOR_TEAM ? 'team' : 'applicant';

        $subject = $t("{$group}.subject", ['country' => $country, 'name' => $applicant]);

        $rows = [
            $t('labels.country') => $country,
            $t('labels.visa_type') => $application->visa_type,
            $t('labels.travel_date') => $application->travel_date?->format('d/m/Y'),
            $t('labels.name') => $applicant,
        ];

        if ($this->audience === self::FOR_TEAM) {
            $rows += [
                $t('labels.email') => $application->email,
                $t('labels.phone') => $application->phone,
                $t('labels.passport_number') => $application->passport_number,
                $t('labels.birth_date') => $application->birth_date?->format('d/m/Y'),
                $t('labels.previous_visa') => $application->previous_visa ? $t('yes') : $t('no'),
                $t('labels.notes') => $application->notes,
                $t('labels.passport_copy') => $application->passport_copy_path ? $t('attached') : $t('not_provided'),
            ];
        }

        $message = (new MailMessage)
            ->subject($subject)
            ->view('emails.visa-application', [
                'subject' => $subject,
                'headerSubtitle' => $subject,
                'greeting' => $t("{$group}.greeting", ['name' => $application->first_name]),
                'introLine' => $t("{$group}.intro", ['country' => $country, 'name' => $applicant]),
                'detailsLabel' => $t('labels.details'),
                'rows' => array_filter($rows, fn ($value) => $value !== null && $value !== ''),
                'closingLine' => $t("{$group}.closing"),
            ]);

        if ($this->audience === self::FOR_TEAM) {
            $message->replyTo($application->email, $applicant);

            $path = $application->passport_copy_path;
            if ($path && Storage::disk('public')->exists($path)) {
                $message->attach(Storage::disk('public')->path($path), [
                    'as' => 'passport-'.str($applicant)->slug().'.'.pathinfo($path, PATHINFO_EXTENSION),
                ]);
            }
        }

        return $message;
    }
}
