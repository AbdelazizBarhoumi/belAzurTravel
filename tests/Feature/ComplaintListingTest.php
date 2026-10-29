<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Models are strict (no lazy loading), so the complaint payloads must load
 * their booking, user and replies up front — this used to 500 in production.
 */
class ComplaintListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_client_can_list_complaints_with_bookings_and_replies(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'client']);
        $booking = Booking::query()->create([
            'user_id' => $client->id,
            'booking_ref' => 1,
            'type' => 'tour',
            'item_slug' => 'sahara',
            'client' => ['name' => 'Jane', 'email' => 'jane@example.com'],
            'total_amount' => 450,
            'status' => 'Pending',
            'start_date' => now()->addDays(5),
        ]);

        $complaintId = $this->actingAs($client)->postJson('/api/client/complaints', [
            'type' => 'refund_request',
            'subject' => 'Refund',
            'description' => 'Please refund',
            'booking_id' => $booking->id,
        ])->assertCreated()->json('id');

        $this->actingAs($admin)
            ->postJson("/api/admin/complaints/{$complaintId}/reply", ['message' => 'On it'])
            ->assertOk();

        $this->actingAs($admin)->getJson('/api/admin/complaints')
            ->assertOk()
            ->assertJsonPath('0.booking.id', $booking->id)
            ->assertJsonPath('0.user.id', $client->id);

        $this->actingAs($client)->getJson('/api/client/complaints')
            ->assertOk()
            ->assertJsonPath('0.booking.id', $booking->id);
    }
}
