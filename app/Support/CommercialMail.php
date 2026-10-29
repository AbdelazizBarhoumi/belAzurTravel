<?php

namespace App\Support;

use App\Models\SiteSetting;
use Illuminate\Notifications\Notification as BaseNotification;
use Illuminate\Support\Facades\Notification;
use Throwable;

/**
 * The commercial team's inbox: receives visa applications, new bookings and
 * travel requests. Configurable in Admin → Company, with an env fallback.
 */
class CommercialMail
{
    public static function address(): string
    {
        try {
            $fromSettings = SiteSetting::query()->value('commercial_email');
        } catch (Throwable) {
            $fromSettings = null;
        }

        return $fromSettings ?: config('mail.commercial_address');
    }

    /**
     * Mail a notification to the commercial inbox. Never throws: a mail
     * failure is reported but must not break the request that triggered it.
     */
    public static function notify(BaseNotification $notification): void
    {
        try {
            Notification::route('mail', self::address())->notify($notification);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
