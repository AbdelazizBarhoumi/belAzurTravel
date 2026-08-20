<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BookingE2ETest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_booking_flow(): void
    {
        Notification::fake();

        // 1. Setup Admin and Client
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $client = User::factory()->create(['role' => 'client']);
        $destination = Destination::factory()->create(['slug' => 'paris']);

        // 2. Client creates a booking
        $bookingData = [
            'type' => 'destination',
            'item_slug' => 'paris',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'client' => [
                'name' => 'John Doe',
                'email' => 'john@belazurtravel.com',
                'phone' => '123456789',
            ],
            'travelers' => [['name' => 'Jane Doe']],
            'amount' => 1500,
            'notes' => 'Special anniversary trip',
        ];

        $response = $this->actingAs($client)->postJson('/api/bookings', $bookingData);

        $response->assertStatus(201);
        $bookingId = $response->json('id');

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'user_id' => $client->id,
            'status' => 'Pending',
            'total_amount' => 1500,
        ]);

        // Verify Admin notified
        Notification::assertSentTo(
            $admin,
            BookingActivityNotification::class,
            function ($notification) {
                return $notification->toDatabase($admin ?? new User)['type'] === 'booking.submitted';
            }
        );

        // 3. Admin approves the booking
        $approveResponse = $this->actingAs($admin)->postJson("/api/admin/bookings/{$bookingId}/approve");

        $approveResponse->assertStatus(200);
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'Confirmed',
        ]);

        // No payment record is fabricated on approval.
        $this->assertDatabaseMissing('payments', [
            'booking_id' => $bookingId,
        ]);

        // Verify Client notified
        Notification::assertSentTo(
            $client,
            BookingStatusNotification::class
        );

        // 4. Client cancels the booking (if allowed)
        $cancelResponse = $this->actingAs($client)->postJson("/api/bookings/{$bookingId}/cancel");
        $cancelResponse->assertStatus(200);

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'Cancelled',
        ]);

        // Verify Admin notified of cancellation
        Notification::assertSentTo(
            $admin,
            BookingActivityNotification::class,
            function ($notification) {
                return $notification->toDatabase($admin ?? new User)['type'] === 'booking.cancelled';
            }
        );
    }
}
