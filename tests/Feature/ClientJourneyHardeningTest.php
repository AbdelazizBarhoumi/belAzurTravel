<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Client-side guarantees: prices come from the catalogue, cancellation obeys
 * the status machine, deactivated accounts are locked out and a changed
 * email must be verified again.
 */
class ClientJourneyHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    private function bookingPayload(array $overrides = []): array
    {
        return array_merge([
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(13)->toDateString(),
            'client' => ['name' => 'Jane Client', 'email' => 'jane@example.com'],
            'amount' => 1,
        ], $overrides);
    }

    public function test_tour_price_comes_from_catalogue_times_participants(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Tour::factory()->create(['slug' => 'sahara', 'price' => 450]);

        $this->actingAs($client)
            ->postJson('/api/bookings', $this->bookingPayload([
                'type' => 'tour',
                'item_slug' => 'sahara',
                'details' => ['participants' => 3],
            ]))
            ->assertCreated()
            ->assertJsonPath('total_amount', 1350);
    }

    public function test_car_price_is_per_day(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Car::factory()->create(['slug' => 'clio-5', 'price' => 100]);

        $this->actingAs($client)
            ->postJson('/api/bookings', $this->bookingPayload([
                'type' => 'car',
                'item_slug' => 'clio-5',
            ]))
            ->assertCreated()
            ->assertJsonPath('total_amount', 300);
    }

    public function test_past_start_date_is_rejected(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Tour::factory()->create(['slug' => 'sahara', 'price' => 450]);

        $this->actingAs($client)
            ->postJson('/api/bookings', $this->bookingPayload([
                'type' => 'tour',
                'item_slug' => 'sahara',
                'start_date' => now()->subDay()->toDateString(),
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_date']);
    }

    public function test_completed_booking_cannot_be_cancelled(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $booking = Booking::query()->create([
            'user_id' => $client->id,
            'booking_ref' => 1,
            'type' => 'tour',
            'item_slug' => 'sahara',
            'client' => ['name' => 'Jane', 'email' => 'jane@example.com'],
            'total_amount' => 450,
            'status' => 'Completed',
        ]);

        $this->actingAs($client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertStatus(422);

        $this->assertSame('Completed', $booking->refresh()->status);
    }

    public function test_client_cannot_see_another_clients_booking(): void
    {
        $owner = User::factory()->create(['role' => 'client']);
        $other = User::factory()->create(['role' => 'client']);
        $booking = Booking::query()->create([
            'user_id' => $owner->id,
            'booking_ref' => 1,
            'type' => 'tour',
            'item_slug' => 'sahara',
            'client' => ['name' => 'Jane', 'email' => 'jane@example.com'],
            'total_amount' => 450,
            'status' => 'Pending',
        ]);

        $this->actingAs($other)->getJson("/api/bookings/{$booking->id}")->assertForbidden();
        $this->actingAs($other)->postJson("/api/bookings/{$booking->id}/cancel")->assertForbidden();
    }

    public function test_deactivated_user_is_locked_out_of_client_api(): void
    {
        $client = User::factory()->create(['role' => 'client', 'active' => false]);

        $this->actingAs($client)->getJson('/api/client/dashboard')->assertForbidden();
    }

    public function test_deactivated_user_cannot_log_in(): void
    {
        $client = User::factory()->create(['role' => 'client', 'active' => false]);

        $this->postJson('/login', ['email' => $client->email, 'password' => 'password'])
            ->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_changing_email_requires_new_verification(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)
            ->putJson('/api/client/profile', ['name' => $client->name, 'email' => 'new-address@example.com'])
            ->assertOk();

        $this->assertNull($client->refresh()->email_verified_at);
        Notification::assertSentTo($client, VerifyEmail::class);
    }
}
