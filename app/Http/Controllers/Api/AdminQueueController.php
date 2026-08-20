<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Complaint;
use App\Models\SupportInquiry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin unified "Needs action" queue.
 *
 * Consolidates bookings, complaints, refund requests and support inquiries
 * that need attention into a single payload with actionable counts.
 */
class AdminQueueController extends Controller
{
    public function counts(): JsonResponse
    {
        return response()->json($this->sectionCounts());
    }

    public function index(Request $request): JsonResponse
    {
        $section = $request->input('section');

        $bookings = in_array($section, [null, 'bookings'], true)
            ? $this->bookings()
            : [];

        $complaints = in_array($section, [null, 'complaints'], true)
            ? $this->complaints('complaint')
            : [];

        $refundRequests = in_array($section, [null, 'refund_requests'], true)
            ? $this->complaints('refund_request')
            : [];

        $support = in_array($section, [null, 'support'], true)
            ? $this->support()
            : [];

        return response()->json([
            'counts' => $this->sectionCounts(),
            'bookings' => $bookings,
            'complaints' => $complaints,
            'refund_requests' => $refundRequests,
            'support' => $support,
        ]);
    }

    private function sectionCounts(): array
    {
        $bookings = Booking::query()
            ->whereIn('status', ['Pending', 'Approved'])
            ->count();

        $complaints = Complaint::query()
            ->where('type', 'complaint')
            ->whereIn('status', ['pending', 'in_review'])
            ->count();

        $refundRequests = Complaint::query()
            ->where('type', 'refund_request')
            ->whereIn('status', ['pending', 'in_review'])
            ->count();

        $support = SupportInquiry::query()
            ->whereIn('status', ['new', 'in-progress'])
            ->count();

        return [
            'bookings' => $bookings,
            'complaints' => $complaints,
            'refund_requests' => $refundRequests,
            'support' => $support,
            'total' => $bookings + $complaints + $refundRequests + $support,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function bookings(): array
    {
        return Booking::query()
            ->whereIn('status', ['Pending', 'Approved'])
            ->with('audits.actor')
            ->get()
            ->sortBy([
                fn (Booking $booking) => $booking->status === 'Pending' ? 0 : 1,
                fn (Booking $booking) => $booking->start_date?->timestamp ?? PHP_INT_MAX,
                fn (Booking $booking) => $booking->created_at?->timestamp ?? PHP_INT_MAX,
            ])
            ->values()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'user_id' => $booking->user_id,
                'type' => $booking->type,
                'items' => $booking->items ?? [],
                'start_date' => $this->dateString($booking->start_date),
                'end_date' => $this->dateString($booking->end_date),
                'client' => $booking->client,
                'total_amount' => $booking->total_amount,
                'status' => $booking->status,
                'created_at' => $booking->created_at?->toJSON(),
                'expires_at' => $booking->expires_at?->toJSON(),
                'reject_reason' => $booking->reject_reason,
                'cancel_reason' => $booking->cancel_reason,
                'provider_booking_id' => $booking->provider_booking_id,
                'provider_booking_reference' => $booking->provider_booking_reference,
                'provider_prebook' => $booking->provider_payload['prebook'] ?? null,
                'is_provider' => $booking->provider_booking_id !== null
                    || ! empty($booking->provider_payload),
                'audits' => $booking->audits
                    ->sortBy('id')
                    ->map(fn ($audit) => [
                        'id' => $audit->id,
                        'action' => $audit->action,
                        'actor_id' => $audit->actor_id,
                        'actor_role' => $audit->actor_role,
                        'actor_name' => $audit->actor?->name,
                        'from_status' => $audit->from_status?->value,
                        'to_status' => $audit->to_status?->value,
                        'notes' => $audit->notes,
                        'created_at' => $audit->created_at?->toJSON(),
                    ])
                    ->values(),
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function complaints(string $type): array
    {
        return Complaint::query()
            ->where('type', $type)
            ->whereIn('status', ['pending', 'in_review'])
            ->with('user', 'booking', 'replies')
            ->get()
            ->sortBy([
                fn (Complaint $complaint) => $this->priorityRank($complaint->priority),
                fn (Complaint $complaint) => $complaint->created_at?->timestamp ?? PHP_INT_MAX,
            ])
            ->values()
            ->map(fn (Complaint $complaint) => [
                'id' => $complaint->id,
                'type' => $complaint->type,
                'subject' => $complaint->subject,
                'description' => $complaint->description,
                'booking_id' => $complaint->booking_id,
                'booking' => $complaint->booking ? [
                    'id' => $complaint->booking->id,
                    'type' => $complaint->booking->type,
                    'total_amount' => $complaint->booking->total_amount,
                    'status' => $complaint->booking->status,
                    'start_date' => $this->dateString($complaint->booking->start_date),
                    'end_date' => $this->dateString($complaint->booking->end_date),
                ] : null,
                'user' => $complaint->user ? [
                    'id' => $complaint->user->id,
                    'name' => $complaint->user->name,
                    'email' => $complaint->user->email,
                ] : null,
                'refund_amount' => $complaint->refund_amount,
                'status' => $complaint->status,
                'priority' => $complaint->priority,
                'admin_reply' => $complaint->admin_reply,
                'replies' => $complaint->replies->map(fn ($reply) => [
                    'id' => $reply->id,
                    'sender' => $reply->sender,
                    'message' => $reply->message,
                    'created_at' => $reply->created_at?->toJSON(),
                ])->values(),
                'created_at' => $complaint->created_at?->toJSON(),
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function support(): array
    {
        return SupportInquiry::query()
            ->whereIn('status', ['new', 'in-progress'])
            ->get()
            ->sortBy([
                fn (SupportInquiry $inquiry) => $this->priorityRank($inquiry->priority),
                fn (SupportInquiry $inquiry) => $inquiry->created_at?->timestamp ?? PHP_INT_MAX,
            ])
            ->values()
            ->map(fn (SupportInquiry $inquiry) => [
                'id' => $inquiry->id,
                'user_id' => $inquiry->user_id,
                'client' => $inquiry->client,
                'subject' => $inquiry->subject,
                'message' => $inquiry->message,
                'status' => $inquiry->status,
                'priority' => $inquiry->priority,
                'replies' => $inquiry->replies ?? [],
                'created_at' => $inquiry->created_at?->toJSON(),
            ])
            ->all();
    }

    private function priorityRank(string $priority): int
    {
        return match ($priority) {
            'high' => 0,
            'medium' => 1,
            default => 2,
        };
    }

    private function dateString(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        return Carbon::parse($value)->toDateString();
    }
}
