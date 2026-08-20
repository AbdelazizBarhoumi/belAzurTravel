<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationE2ETest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an admin to receive notifications
        User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    public function test_client_booking_notifies_operations(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        // Create the hotel being booked (request mode so it stays Pending and
        // exercises the booking.created notification flow).
        Hotel::forceCreate([
            'name' => ['en' => 'Luxury Resort'],
            'slug' => 'luxury-resort',
            'code' => 'LUX-001',
            'location' => ['en' => 'Bali'],
            'price' => 200,
            'rating' => 5,
            'image' => 'hotel.jpg',
            'booking_mode' => 'request',
        ]);

        $this->actingAs($client)->postJson('/api/bookings', [
            'type' => 'hotel',
            'item_slug' => 'luxury-resort',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(15)->toDateString(),
            'client' => [
                'name' => 'John Doe',
                'email' => 'john@belazurtravel.com',
            ],
            'amount' => 1000,
        ])->assertStatus(201);

        // Check if admin got a notification
        $admin = User::where('role', 'admin')->first();
        $this->assertEquals(1, $admin->unreadNotifications()->count());
        $this->assertEquals('booking.submitted', $admin->unreadNotifications()->first()->data['type']);

    }

    public function test_admin_confirm_notifies_client_and_other_ops(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $booking = Booking::create([
            'user_id' => $client->id,
            'type' => 'hotel',
            'item_slug' => 'luxury-resort',
            'client' => ['name' => 'John Doe', 'email' => 'john@belazurtravel.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
        ]);

        $admin = User::where('role', 'admin')->first();

        $this->actingAs($admin)->postJson("/api/admin/bookings/{$booking->id}/confirm")
            ->assertOk();

        // Client should be notified
        $this->assertEquals(1, $client->unreadNotifications()->count());
        $this->assertEquals('booking.status_changed', $client->unreadNotifications()->first()->data['type']);

        // Admin should be notified
        $admin = User::where('role', 'admin')->first();
        $this->assertEquals(1, $admin->unreadNotifications()->count());
        $this->assertEquals('booking.confirmed', $admin->unreadNotifications()->first()->data['type']);
    }

    public function test_support_inquiry_notifies_operations(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)->postJson('/api/client/support', [
            'subject' => 'Help needed',
            'message' => 'I have a question about my booking.',
        ])->assertStatus(201);

        // Admin should be notified
        $admin = User::where('role', 'admin')->first();
        $this->assertEquals(1, $admin->unreadNotifications()->count());
        $this->assertEquals('message.new', $admin->unreadNotifications()->first()->data['type']);
    }

    public function test_assistant_routes_are_disabled(): void
    {
        $this->getJson('/api/assistant/summary')->assertNotFound();
        $this->postJson('/api/assistant/inquiries/1/reply', ['message' => 'This is a reply.'])->assertNotFound();
    }

    public function test_client_cancellation_notifies_operations(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $booking = Booking::create([
            'user_id' => $client->id,
            'type' => 'hotel',
            'item_slug' => 'luxury-resort',
            'client' => ['name' => 'John Doe', 'email' => 'john@belazurtravel.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
        ]);

        $this->actingAs($client)->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk();

        // Admin should be notified
        $admin = User::where('role', 'admin')->first();
        $this->assertEquals(1, $admin->unreadNotifications()->count());
        $this->assertEquals('booking.cancelled', $admin->unreadNotifications()->first()->data['type']);
    }
}
