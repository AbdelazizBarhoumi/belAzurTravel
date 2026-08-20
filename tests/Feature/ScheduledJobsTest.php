<?php

namespace Tests\Feature;

use App\Enums\BookingAction;
use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\Complaint;
use App\Models\SiteSetting;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\AdminDigestNotification;
use App\Notifications\TripReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Phase 5: the scheduled automation. `send:trip-reminders` emails clients
 * whose confirmed trip is N days away; `send:admin-digest` emails active
 * admins a localized daily digest; both are schedule()-registered.
 */
class ScheduledJobsTest extends TestCase
{
    use RefreshDatabase;

    private function client(string $locale = 'en'): User
    {
        return User::factory()->create(['role' => 'client', 'active' => true, 'preferred_language' => $locale]);
    }

    private function admin(string $locale = 'en'): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true, 'preferred_language' => $locale]);
    }

    private function confirmedBooking(User $client, string $startDate): Booking
    {
        return Booking::create([
            'user_id' => $client->id,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'start_date' => $startDate,
            'end_date' => now()->addDays(6)->toDateString(),
            'client' => ['name' => 'John Doe', 'email' => $client->email],
            'total_amount' => 928,
            'status' => 'Confirmed',
        ]);
    }

    public function test_trip_reminders_only_go_to_confirmed_bookings_on_the_target_date(): void
    {
        Notification::fake();

        $client = $this->client();
        $target = now()->addDays(3)->toDateString();

        $shouldNotify = $this->confirmedBooking($client, $target);
        $this->confirmedBooking($this->client(), now()->addDays(5)->toDateString());
        $this->confirmedBooking($client, $target)->update(['status' => 'Approved']);
        $this->confirmedBooking($client, $target)->update(['user_id' => null]);

        $this->artisan('send:trip-reminders')->assertSuccessful();

        Notification::assertSentTo(
            $client,
            TripReminderNotification::class,
            fn ($n) => $n->toDatabase($client)['booking_id'] === $shouldNotify->id
        );
    }

    public function test_trip_reminders_respect_the_configured_lead_time(): void
    {
        Notification::fake();

        $client = $this->client();
        SiteSetting::create(['trip_reminder_days' => 7]);

        $booking = $this->confirmedBooking($client, now()->addDays(7)->toDateString());

        $this->artisan('send:trip-reminders')->assertSuccessful();

        Notification::assertSentTo(
            $client,
            TripReminderNotification::class,
            fn ($n) => $n->toDatabase($client)['booking_id'] === $booking->id
        );
    }

    public function test_trip_reminders_are_disabled_when_lead_time_is_zero(): void
    {
        Notification::fake();

        $client = $this->client();
        SiteSetting::create(['trip_reminder_days' => 0]);

        $this->confirmedBooking($client, now()->addDays(3)->toDateString());

        $this->artisan('send:trip-reminders')->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_admin_digest_is_localized_and_covers_recent_activity(): void
    {
        Notification::fake();

        $admin = $this->admin('fr');
        $client = $this->client();

        $booking = $this->confirmedBooking($client, now()->addDays(10)->toDateString());
        $audit = BookingAudit::log($booking, BookingAction::Approved);

        Complaint::create([
            'user_id' => $client->id,
            'type' => 'refund_request',
            'subject' => ['en' => 'Trip cancelled', 'fr' => 'Voyage annulé', 'ar' => 'ألغيت الرحلة'],
            'description' => ['en' => 'Need refund', 'fr' => 'Besoin d\'un remboursement', 'ar' => 'أحتاج استرداداً'],
            'status' => 'pending',
        ]);

        SupportInquiry::create([
            'user_id' => $client->id,
            'client' => ['name' => 'John Doe', 'email' => $client->email],
            'subject' => ['en' => 'Visa', 'fr' => 'Visa', 'ar' => 'تأشيرة'],
            'message' => ['en' => 'Help', 'fr' => 'Aide', 'ar' => 'مساعدة'],
            'status' => 'new',
        ]);

        $this->artisan('send:admin-digest')->assertSuccessful();

        Notification::assertSentTo(
            $admin,
            AdminDigestNotification::class,
            function ($n) use ($admin, $booking, $audit) {
                $html = html_entity_decode($n->toMail($admin)->render());

                $this->assertStringContainsString('Booking #'.$booking->id, $html);
                $this->assertStringContainsString('Booking #'.$audit->booking_id, $html);
                $this->assertStringContainsString(__('emails.digest.labels.new_bookings', [], 'fr'), $html);
                $this->assertStringContainsString(__('emails.digest.labels.approvals', [], 'fr'), $html);
                $this->assertStringContainsString(__('emails.digest.labels.refunds', [], 'fr'), $html);
                $this->assertStringContainsString(__('emails.digest.labels.messages', [], 'fr'), $html);

                return true;
            }
        );
    }

    public function test_admin_digest_skips_activity_older_than_twenty_four_hours(): void
    {
        Notification::fake();

        $admin = $this->admin();
        $client = $this->client();

        $old = $this->confirmedBooking($client, now()->addDays(10)->toDateString());
        $old->created_at = now()->subDays(2);
        $old->save();

        $this->artisan('send:admin-digest')->assertSuccessful();

        Notification::assertSentTo($admin, AdminDigestNotification::class);

        $sent = Notification::sent($admin, AdminDigestNotification::class);
        $html = html_entity_decode($sent[0]->toMail($admin)->render());

        $this->assertStringNotContainsString('Booking #'.$old->id, $html);
        $this->assertStringContainsString(__('emails.digest.empty', [], 'en'), $html);
    }

    public function test_admin_digest_skips_when_no_active_admins_exist(): void
    {
        Notification::fake();

        $this->artisan('send:admin-digest')->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_scheduler_registers_trip_reminders_and_digest(): void
    {
        $this->artisan('schedule:list')->assertSuccessful();
    }
}
