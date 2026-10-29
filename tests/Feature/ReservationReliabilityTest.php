<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Event;
use App\Models\SiteSetting;
use App\Models\Travel;
use App\Models\User;
use App\Models\Visa;
use App\Notifications\BookingActivityNotification;
use App\Notifications\VisaApplicationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

class ReservationReliabilityTest extends TestCase
{
    use RefreshDatabase;

    private function payload(string $type, string $slug): array
    {
        return [
            'type' => $type,
            'item_slug' => $slug,
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(15)->toDateString(),
            'client' => ['name' => 'Sami Ben Ali', 'email' => 'sami@example.com', 'phone' => '+21620000000'],
            'amount' => 900,
        ];
    }

    public function test_travel_event_and_car_can_be_booked(): void
    {
        Notification::fake();
        $client = User::factory()->create(['role' => 'client']);

        Travel::query()->create([
            'slug' => 'istanbul-week', 'name' => ['fr' => 'Istanbul'], 'description' => ['fr' => '-'],
            'location' => ['fr' => 'Istanbul'], 'image' => '/img.jpg',
        ]);
        Event::factory()->create(['slug' => 'festival-carthage']);
        Car::factory()->create(['slug' => 'clio-5']);

        foreach (['travel' => 'istanbul-week', 'event' => 'festival-carthage', 'car' => 'clio-5'] as $type => $slug) {
            $this->actingAs($client)
                ->postJson('/api/bookings', $this->payload($type, $slug))
                ->assertCreated()
                ->assertJsonPath('type', $type)
                ->assertJsonPath('start_date', now()->addDays(10)->toDateString());
        }

        $this->assertSame([1, 2, 3], Booking::query()->orderBy('booking_ref')->pluck('booking_ref')->all());
    }

    public function test_a_broken_mail_transport_does_not_fail_the_booking(): void
    {
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', 'smtp.invalid');
        Config::set('queue.default', 'sync');
        Notification::shouldReceive('send')->andThrow(new RuntimeException('535 Authentication failed'));

        User::factory()->create(['role' => 'admin', 'active' => true]);
        $client = User::factory()->create(['role' => 'client']);
        Car::factory()->create(['slug' => 'clio-5']);

        $this->actingAs($client)
            ->postJson('/api/bookings', $this->payload('car', 'clio-5'))
            ->assertCreated();

        $this->assertSame(1, Booking::query()->count());
    }

    public function test_new_booking_is_mailed_to_the_commercial_inbox(): void
    {
        Notification::fake();
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', 'smtp.example.com');
        SiteSetting::query()->create(['company_name' => 'BelAzur', 'commercial_email' => 'sales@example.com']);

        $client = User::factory()->create(['role' => 'client']);
        Car::factory()->create(['slug' => 'clio-5']);

        $this->actingAs($client)->postJson('/api/bookings', $this->payload('car', 'clio-5'))->assertCreated();

        Notification::assertSentOnDemand(
            BookingActivityNotification::class,
            fn ($notification, $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'sales@example.com'
                && $channels === ['mail'],
        );
    }

    public function test_visa_application_mails_commercial_team_and_applicant(): void
    {
        Notification::fake();
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', 'smtp.example.com');

        $visa = Visa::query()->create([
            'code' => 'FR', 'name' => ['fr' => 'France', 'en' => 'France'], 'flag' => 'FR',
            'processing' => ['fr' => '15 jours'], 'price' => 250, 'is_active' => true,
        ]);

        $this->postJson('/api/visa-applications', [
            'visa_id' => $visa->id,
            'first_name' => 'Amina',
            'last_name' => 'Trabelsi',
            'email' => 'amina@example.com',
            'phone' => '+21622000000',
            'passport_number' => 'X1234567',
            'birth_date' => '1990-05-01',
            'travel_date' => now()->addMonth()->toDateString(),
            'visa_type' => 'tourist',
        ])->assertCreated();

        $sentTo = [];
        Notification::assertSentOnDemand(VisaApplicationNotification::class, function ($n, $c, $notifiable) use (&$sentTo) {
            $sentTo[] = $notifiable->routes['mail'];

            return true;
        });

        $this->assertEqualsCanonicalizing(['commercial@belazurtravel.com', 'amina@example.com'], $sentTo);
    }

    public function test_visa_mails_render_for_team_and_applicant(): void
    {
        $visa = Visa::query()->create([
            'code' => 'FR', 'name' => ['fr' => 'France', 'en' => 'France'], 'flag' => 'FR',
            'processing' => ['fr' => '15 jours'], 'price' => 250,
        ]);
        $application = $visa->hasMany(\App\Models\VisaApplication::class)->create([
            'first_name' => 'Amina', 'last_name' => 'Trabelsi', 'email' => 'amina@example.com',
            'phone' => '+21622000000', 'passport_number' => 'X1234567', 'birth_date' => '1990-05-01',
            'travel_date' => '2026-12-01', 'visa_type' => 'tourist', 'notes' => '<b>urgent</b>',
        ]);

        $team = (new VisaApplicationNotification($application))->toMail(new AnonymousNotifiable)->render();
        $this->assertStringContainsString('X1234567', $team);
        $this->assertStringContainsString('&lt;b&gt;urgent&lt;/b&gt;', $team);

        $receipt = (new VisaApplicationNotification($application, VisaApplicationNotification::FOR_APPLICANT, 'en'))
            ->toMail(new AnonymousNotifiable)->render();
        $this->assertStringContainsString('Your visa application for France has been received', $receipt);
        $this->assertStringNotContainsString('X1234567', $receipt);
    }

    public function test_payment_is_unavailable_while_online_payment_is_disabled(): void
    {
        Notification::fake();
        Config::set('payment.online_enabled', false);
        Config::set('payment.clictopay.username', null);

        $client = User::factory()->create(['role' => 'client']);
        Car::factory()->create(['slug' => 'clio-5']);
        $id = $this->actingAs($client)->postJson('/api/bookings', $this->payload('car', 'clio-5'))->json('id');

        $this->actingAs($client)
            ->postJson("/api/bookings/{$id}/pay")
            ->assertStatus(503)
            ->assertJsonPath('code', 'payment_unavailable');
    }
}
