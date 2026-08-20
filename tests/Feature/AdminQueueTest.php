<?php

namespace Tests\Feature;

use App\Enums\BookingAction;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\Complaint;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\SupportReplyNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Phase 2: the admin unified "Needs action" queue and admin support-inquiry
 * endpoints.
 */
class AdminQueueTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = User::factory()->create(['role' => 'client', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function booking(string $status): Booking
    {
        return Booking::create([
            'user_id' => $this->client->id,
            'type' => 'tour',
            'item_slug' => 'greek-island-hopping',
            'items' => [['slug' => 'greek-island-hopping', 'qty' => 1]],
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-08',
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1200,
            'status' => $status,
            'expires_at' => now()->addDays(2),
        ]);
    }

    private function complaint(string $type, string $status, string $priority = 'medium'): Complaint
    {
        return Complaint::create([
            'user_id' => $this->client->id,
            'type' => $type,
            'subject' => ['fr' => 'Sujet', 'ar' => 'موضوع', 'en' => 'Subject'],
            'description' => ['fr' => 'Description', 'ar' => 'وصف', 'en' => 'Description'],
            'status' => $status,
            'priority' => $priority,
        ]);
    }

    private function supportInquiry(string $status, string $priority = 'medium'): SupportInquiry
    {
        return SupportInquiry::create([
            'user_id' => $this->client->id,
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'subject' => ['fr' => 'Aide', 'ar' => 'مساعدة', 'en' => 'Help'],
            'message' => ['fr' => 'Besoin', 'ar' => 'حاجة', 'en' => 'Need'],
            'status' => $status,
            'priority' => $priority,
        ]);
    }

    public function test_queue_returns_actionable_items_and_counts(): void
    {
        $pending = $this->booking('Pending');
        $this->booking('Approved');
        $this->booking('Confirmed');
        $this->complaint('complaint', 'pending', 'high');
        $this->complaint('complaint', 'in_review');
        $this->complaint('complaint', 'resolved');
        $this->complaint('refund_request', 'pending');
        $this->supportInquiry('new');
        $this->supportInquiry('in-progress');
        $this->supportInquiry('resolved');

        $response = $this->actingAs($this->admin)->getJson('/api/admin/queue');

        $response->assertOk()
            ->assertJsonPath('counts.bookings', 2)
            ->assertJsonPath('counts.complaints', 2)
            ->assertJsonPath('counts.refund_requests', 1)
            ->assertJsonPath('counts.support', 2)
            ->assertJsonPath('counts.total', 7)
            ->assertJsonCount(2, 'bookings')
            ->assertJsonCount(2, 'complaints')
            ->assertJsonCount(1, 'refund_requests')
            ->assertJsonCount(2, 'support');

        $bookingIds = collect($response->json('bookings'))->pluck('id');
        $this->assertTrue($bookingIds->contains($pending->id));
        $this->assertNull(
            collect($response->json('bookings'))->first(
                fn (array $b) => $b['status'] === 'Confirmed',
            ),
        );

        $this->assertEquals('complaint', $response->json('complaints.0.type'));
        $this->assertEquals('refund_request', $response->json('refund_requests.0.type'));
    }

    public function test_queue_sorts_by_priority_then_oldest_first(): void
    {
        $this->complaint('complaint', 'pending', 'low');
        $this->complaint('complaint', 'pending', 'high');

        $response = $this->actingAs($this->admin)->getJson('/api/admin/queue');

        $priorities = collect($response->json('complaints'))->pluck('priority');
        $this->assertEquals(['high', 'low'], $priorities->all());
    }

    public function test_queue_section_filter(): void
    {
        $this->booking('Pending');
        $this->complaint('complaint', 'pending');

        $response = $this->actingAs($this->admin)->getJson('/api/admin/queue?section=bookings');

        $response->assertOk()
            ->assertJsonCount(1, 'bookings')
            ->assertJsonCount(0, 'complaints')
            ->assertJsonCount(0, 'refund_requests')
            ->assertJsonCount(0, 'support');
    }

    public function test_queue_counts_endpoint(): void
    {
        $this->booking('Pending');
        $this->complaint('refund_request', 'pending');

        $response = $this->actingAs($this->admin)->getJson('/api/admin/queue/counts');

        $response->assertOk()
            ->assertJsonPath('bookings', 1)
            ->assertJsonPath('complaints', 0)
            ->assertJsonPath('refund_requests', 1)
            ->assertJsonPath('support', 0)
            ->assertJsonPath('total', 2);
    }

    public function test_queue_booking_payload_includes_audits(): void
    {
        $booking = $this->booking('Pending');
        BookingAudit::log(
            booking: $booking,
            action: BookingAction::Submitted,
            from: null,
            to: BookingStatus::Pending,
            actor: $this->client,
            notes: 'Booking submitted',
        );

        $response = $this->actingAs($this->admin)->getJson('/api/admin/queue?section=bookings');

        $response->assertOk();
        $audits = $response->json('bookings.0.audits');
        $this->assertIsArray($audits);
        $this->assertNotEmpty($audits);
        $this->assertEquals('submitted', $audits[0]['action']);
        $this->assertEquals($this->client->name, $audits[0]['actor_name']);
        $this->assertEquals($booking->id, $response->json('bookings.0.id'));
    }

    public function test_queue_requires_admin(): void
    {
        $this->getJson('/api/admin/queue')->assertUnauthorized();
        $this->actingAs($this->client)->getJson('/api/admin/queue')->assertForbidden();
        $this->actingAs($this->client)->getJson('/api/admin/queue/counts')->assertForbidden();
    }

    public function test_admin_updates_support_inquiry_status_and_priority(): void
    {
        $inquiry = $this->supportInquiry('new', 'medium');

        $response = $this->actingAs($this->admin)->putJson(
            "/api/admin/support-inquiries/{$inquiry->id}",
            ['status' => 'resolved', 'priority' => 'high'],
        );

        $response->assertOk()
            ->assertJsonPath('status', 'resolved')
            ->assertJsonPath('priority', 'high')
            ->assertJsonPath('assigned_to', $this->admin->id)
            ->assertJsonPath('resolved_at', fn ($value) => $value !== null);

        $this->assertDatabaseHas('support_inquiries', [
            'id' => $inquiry->id,
            'status' => 'resolved',
            'assigned_to' => $this->admin->id,
        ]);
    }

    public function test_admin_reply_to_support_inquiry_notifies_client(): void
    {
        Notification::fake();

        $inquiry = $this->supportInquiry('new');

        $response = $this->actingAs($this->admin)->postJson(
            "/api/admin/support-inquiries/{$inquiry->id}/reply",
            ['message' => 'We are on it.'],
        );

        $response->assertOk()
            ->assertJsonPath('status', 'in-progress');

        $replies = $inquiry->refresh()->replies;
        $this->assertCount(1, $replies);
        $this->assertEquals('We are on it.', $replies[0]['message']);
        $this->assertEquals($this->admin->id, $replies[0]['author_id']);

        Notification::assertSentTo($this->client, SupportReplyNotification::class);
    }

    public function test_admin_reply_requires_message(): void
    {
        $inquiry = $this->supportInquiry('new');

        $this->actingAs($this->admin)
            ->postJson("/api/admin/support-inquiries/{$inquiry->id}/reply", [])
            ->assertUnprocessable();
    }
}
