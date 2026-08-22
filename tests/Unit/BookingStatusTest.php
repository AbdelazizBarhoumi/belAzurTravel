<?php

namespace Tests\Unit;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class BookingStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_legal_transitions(): void
    {
        $this->assertTrue(BookingStatus::Pending->canTransitionTo(BookingStatus::Approved));
        $this->assertTrue(BookingStatus::Pending->canTransitionTo(BookingStatus::Rejected));
        $this->assertTrue(BookingStatus::Pending->canTransitionTo(BookingStatus::Cancelled));
        $this->assertTrue(BookingStatus::Pending->canTransitionTo(BookingStatus::Expired));
        $this->assertTrue(BookingStatus::Approved->canTransitionTo(BookingStatus::Confirmed));
        $this->assertTrue(BookingStatus::Confirmed->canTransitionTo(BookingStatus::Cancelled));
        $this->assertTrue(BookingStatus::Confirmed->canTransitionTo(BookingStatus::Completed));
    }

    public function test_illegal_transitions_are_rejected(): void
    {
        $this->assertFalse(BookingStatus::Pending->canTransitionTo(BookingStatus::Confirmed));
        $this->assertFalse(BookingStatus::Pending->canTransitionTo(BookingStatus::Completed));
        $this->assertFalse(BookingStatus::Confirmed->canTransitionTo(BookingStatus::Approved));
        $this->assertFalse(BookingStatus::Confirmed->canTransitionTo(BookingStatus::Pending));
        $this->assertFalse(BookingStatus::Rejected->canTransitionTo(BookingStatus::Confirmed));
        $this->assertFalse(BookingStatus::Cancelled->canTransitionTo(BookingStatus::Confirmed));
        $this->assertFalse(BookingStatus::Expired->canTransitionTo(BookingStatus::Pending));
        $this->assertFalse(BookingStatus::Completed->canTransitionTo(BookingStatus::Confirmed));
    }

    public function test_terminal_states(): void
    {
        foreach ([BookingStatus::Rejected, BookingStatus::Cancelled, BookingStatus::Expired, BookingStatus::Completed] as $status) {
            $this->assertTrue($status->isTerminal());
        }

        $this->assertFalse(BookingStatus::Pending->isTerminal());
        $this->assertFalse(BookingStatus::Approved->isTerminal());
        $this->assertFalse(BookingStatus::Confirmed->isTerminal());
    }

    public function test_transition_updates_status_stamps_timestamps_and_logs_audit(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $booking = Booking::create([
            'user_id' => $user->id,
            'type' => 'hotel',
            'item_slug' => 'hotel-badira',
            'items' => [['slug' => 'hotel-badira', 'id' => null, 'qty' => 1]],
            'client' => ['name' => $user->name, 'email' => $user->email, 'phone' => null],
            'total_amount' => 1000,
            'status' => BookingStatus::Pending->value,
        ]);

        $this->assertTrue($booking->transitionTo(BookingStatus::Approved, $admin, 'Demande acceptée'));
        $this->assertSame(BookingStatus::Approved->value, $booking->fresh()->status);

        $this->assertTrue($booking->transitionTo(BookingStatus::Confirmed, $admin));
        $this->assertSame(BookingStatus::Confirmed->value, $booking->fresh()->status);
        $this->assertNotNull($booking->fresh()->confirmed_at);

        $audits = BookingAudit::query()->where('booking_id', $booking->id)->orderBy('id')->get();
        $this->assertCount(2, $audits);

        $this->assertSame('Pending', $audits[0]->from_status->value);
        $this->assertSame('Approved', $audits[0]->to_status->value);
        $this->assertSame('approved', $audits[0]->action);
        $this->assertSame($admin->id, $audits[0]->actor_id);
        $this->assertSame('Demande acceptée', $audits[0]->notes);

        $this->assertSame('Approved', $audits[1]->from_status->value);
        $this->assertSame('Confirmed', $audits[1]->to_status->value);
        $this->assertSame('confirmed', $audits[1]->action);
        $this->assertSame($admin->id, $audits[1]->actor_id);
    }

    public function test_rejection_stamps_rejected_at(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $booking = Booking::create([
            'user_id' => $user->id,
            'type' => 'tour',
            'item_slug' => 'tour-omra-2026',
            'items' => [['slug' => 'tour-omra-2026', 'id' => null, 'qty' => 1]],
            'client' => ['name' => $user->name, 'email' => $user->email, 'phone' => null],
            'total_amount' => 1000,
            'status' => BookingStatus::Pending->value,
        ]);

        $this->assertTrue($booking->transitionTo(BookingStatus::Rejected, null, 'Sold out'));
        $fresh = $booking->fresh();
        $this->assertSame(BookingStatus::Rejected->value, $fresh->status);
        $this->assertNotNull($fresh->rejected_at);

        $audit = $booking->audits()->first();
        $this->assertSame('rejected', $audit->action);
        $this->assertNull($audit->actor_id);
    }

    public function test_illegal_transition_changes_nothing_and_logs_nothing(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $booking = Booking::create([
            'user_id' => $user->id,
            'type' => 'flight',
            'item_slug' => 'TU712',
            'items' => [['slug' => 'TU712', 'id' => null, 'qty' => 1]],
            'client' => ['name' => $user->name, 'email' => $user->email, 'phone' => null],
            'total_amount' => 900,
            'status' => BookingStatus::Rejected->value,
        ]);

        $this->assertFalse($booking->transitionTo(BookingStatus::Confirmed));
        $this->assertSame(BookingStatus::Rejected->value, $booking->fresh()->status);
        $this->assertSame(0, BookingAudit::query()->where('booking_id', $booking->id)->count());
    }
}
