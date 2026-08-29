<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\AdminDigestNotification;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use App\Notifications\SupportInquiryNotification;
use App\Notifications\SupportReplyNotification;
use App\Notifications\TripReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Phase 4: every transactional email renders cleanly in all three
 * supported locales with zero HTML errors, and the notification
 * channels include mail only when an SMTP server is configured.
 */
class EmailRenderingTest extends TestCase
{
    use RefreshDatabase;

    public static function locales(): array
    {
        return [['en'], ['fr'], ['ar']];
    }

    private function client(string $locale): User
    {
        return User::factory()->create(['role' => 'client', 'active' => true, 'preferred_language' => $locale]);
    }

    private function admin(string $locale): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true, 'preferred_language' => $locale]);
    }

    private function booking(array $overrides = []): Booking
    {
        return Booking::create(array_merge([
            'user_id' => $this->client('en')->id,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-05',
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 928,
            'status' => 'Confirmed',
            'provider_booking_reference' => 'VOUCH-98765',
            'reject_reason' => null,
            'expires_at' => null,
        ], $overrides));
    }

    private function render(Notification $notification, User $user): string
    {
        $html = $notification->toMail($user)->render();

        $this->assertNotEmpty($html);

        return html_entity_decode($html);
    }

    /** @dataProvider locales */
    public function test_booking_status_mail_renders_in_every_locale(string $locale): void
    {
        app()->setLocale($locale);
        $user = $this->client($locale);

        $statuses = ['Confirmed', 'Approved', 'Rejected', 'Expired', 'Cancelled'];

        foreach ($statuses as $status) {
            $booking = $this->booking([
                'status' => $status,
                'reject_reason' => $status === 'Rejected' ? 'Fully booked for those dates' : null,
            ]);

            $html = $this->render(new BookingStatusNotification($booking), $user);

            $this->assertStringContainsString("#{$booking->booking_ref}", $html);
            $this->assertStringContainsString('TND', $html);
            $this->assertStringContainsString('VOUCH-98765', $html);

            if ($status === 'Rejected') {
                $this->assertStringContainsString('Fully booked for those dates', $html);
            }
        }
    }

    /** @dataProvider locales */
    public function test_admin_booking_activity_mail_renders_in_every_locale(string $locale): void
    {
        app()->setLocale($locale);
        $user = $this->admin($locale);

        $activities = ['booking.submitted', 'booking.approved', 'booking.confirmed', 'booking.rejected', 'booking.cancelled', 'booking.expired', 'booking.paid'];

        foreach ($activities as $activity) {
            $booking = $this->booking([
                'status' => match ($activity) {
                    'booking.rejected' => 'Rejected',
                    'booking.cancelled' => 'Cancelled',
                    'booking.expired' => 'Expired',
                    'booking.approved' => 'Approved',
                    default => 'Confirmed',
                },
                'reject_reason' => $activity === 'booking.rejected' ? 'Fully booked' : null,
            ]);

            $html = $this->render(new BookingActivityNotification($booking, $activity), $user);

            $this->assertStringContainsString("#{$booking->booking_ref}", $html);
            $this->assertStringContainsString('John Doe', $html);
        }
    }

    /** @dataProvider locales */
    public function test_support_mails_render_in_every_locale(string $locale): void
    {
        app()->setLocale($locale);
        $admin = $this->admin($locale);
        $client = $this->client($locale);

        $inquiry = SupportInquiry::create([
            'user_id' => $client->id,
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'subject' => ['en' => 'Visa documents', 'fr' => 'Documents de visa', 'ar' => 'وثائق التأشيرة'],
            'message' => ['en' => 'When will I receive my visa documents?', 'fr' => 'Quand recevrai-je mes documents de visa ?', 'ar' => 'متى سأستلم وثائق التأشيرة؟'],
            'status' => 'new',
            'priority' => 'medium',
            'replies' => [],
        ]);

        $html = $this->render(new SupportInquiryNotification($inquiry), $admin);
        $this->assertStringContainsString('John Doe', $html);
        $this->assertStringContainsString('john@example.com', $html);

        $inquiry->update(['replies' => [
            [
                'author_id' => $admin->id,
                'author' => $admin->name,
                'message' => 'Your documents are on the way.',
                'created_at' => now()->toJSON(),
            ],
        ]]);

        $html = $this->render(new SupportReplyNotification($inquiry, $admin), $client);
        $this->assertStringContainsString('Your documents are on the way.', $html);
        $this->assertStringContainsString("#{$inquiry->id}", $html);
    }

    /** @dataProvider locales */
    public function test_trip_reminder_mail_renders_in_every_locale(string $locale): void
    {
        app()->setLocale($locale);
        $user = $this->client($locale);

        $booking = $this->booking(['start_date' => now()->addDays(3)->toDateString()]);

        $html = $this->render(new TripReminderNotification($booking, 3), $user);

        $this->assertStringContainsString("#{$booking->booking_ref}", $html);
        $this->assertStringContainsString('TND', $html);
    }

    /** @dataProvider locales */
    public function test_admin_digest_mail_renders_empty_and_populated(string $locale): void
    {
        app()->setLocale($locale);
        $user = $this->admin($locale);

        $label = fn (string $key) => __('emails.digest.labels.'.$key, [], $locale);

        $empty = $this->render(new AdminDigestNotification([], '2026-08-20'), $user);
        $this->assertStringContainsString(__('emails.digest.empty', [], $locale), $empty);

        $populated = $this->render(new AdminDigestNotification([
            [
                'label' => $label('new_bookings'),
                'items' => [['title' => 'Booking #1', 'url' => config('app.url').'/admin/bookings/1']],
            ],
            [
                'label' => $label('complaints'),
                'items' => [],
            ],
        ], '2026-08-20'), $user);

        $this->assertStringContainsString('Booking #1', $populated);
        $this->assertStringContainsString($label('new_bookings'), $populated);
    }

    public function test_mail_channel_is_opt_in_on_smtp_configuration(): void
    {
        $booking = $this->booking();
        $user = $this->client('en');
        $notification = new BookingStatusNotification($booking);

        Config::set('mail.default', 'log');
        Config::set('mail.mailers.smtp.host', '127.0.0.1');
        $this->assertSame(['database'], $notification->via($user));

        Config::set('mail.default', 'array');
        Config::set('mail.mailers.smtp.host', '127.0.0.1');
        $this->assertSame(['database'], $notification->via($user));

        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', 'smtp.mailtrap.io');
        $this->assertSame(['database', 'mail'], $notification->via($user));

        Config::set('mail.mailers.smtp.host', '127.0.0.1');
        $this->assertSame(['database'], $notification->via($user));
    }
}
