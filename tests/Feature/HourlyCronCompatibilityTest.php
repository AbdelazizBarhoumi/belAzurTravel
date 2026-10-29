<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Support\ScheduleWindow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

class HourlyCronCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_window_runs_once_on_the_first_tick_after_its_time(): void
    {
        $gate = ScheduleWindow::daily('reminders', '09:00');

        $this->travelTo(now()->setTime(8, 47));
        $this->assertFalse($gate(), 'before 09:00');

        // An hourly cron firing at an arbitrary minute still triggers it.
        $this->travelTo(now()->setTime(9, 47));
        $this->assertTrue($gate());
        $this->travelTo(now()->setTime(10, 47));
        $this->assertFalse($gate(), 'only once per day');

        $this->travelTo(now()->addDay()->setTime(9, 2));
        $this->assertTrue($gate(), 'again the next day');
    }

    public function test_interval_window_runs_once_per_window(): void
    {
        $gate = ScheduleWindow::every('expire', 5);

        $this->travelTo(now()->setTime(10, 0, 30));
        $this->assertTrue($gate());
        $this->travelTo(now()->setTime(10, 3));
        $this->assertFalse($gate());
        $this->travelTo(now()->setTime(11, 17));
        $this->assertTrue($gate(), 'hourly cron: every tick');
    }

    public function test_every_scheduled_task_is_registered(): void
    {
        $this->artisan('schedule:list')
            ->expectsOutputToContain('send:trip-reminders')
            ->expectsOutputToContain('send:admin-digest')
            ->expectsOutputToContain('bookings:expire')
            ->assertSuccessful();
    }

    public function test_mail_is_sent_on_the_deferred_connection(): void
    {
        $notification = new BookingActivityNotification(new Booking, 'booking.submitted');

        $this->assertSame(['mail' => 'deferred', 'database' => 'sync'], $notification->viaConnections());
    }

    public function test_a_failed_deferred_mail_is_queued_for_retry_by_cron(): void
    {
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', 'smtp.example.com');
        Mail::shouldReceive('mailer')->andThrow(new RuntimeException('535 Authentication failed'));

        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $booking = Booking::query()->create([
            'user_id' => $admin->id, 'type' => 'car', 'item_slug' => 'clio', 'status' => 'Pending',
            'client' => ['name' => 'A'], 'total_amount' => 1, 'booking_ref' => 1,
        ]);

        $admin->notify(new BookingActivityNotification($booking, 'booking.submitted'));
        // Deferred callbacks run after the response; run them now.
        try {
            app(\Illuminate\Support\Defer\DeferredCallbackCollection::class)->invoke();
        } catch (RuntimeException) {
            // The failure is re-thrown after the response; the retry is what matters.
        }

        $this->assertSame(1, DB::table('jobs')->count(), 'mail handed to the database queue');
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $admin->id]);
    }
}
