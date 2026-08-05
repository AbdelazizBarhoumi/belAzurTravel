<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Complaint;
use App\Models\ComplaintReply;
use App\Models\User;
use App\Notifications\ComplaintNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $complaints = Complaint::query()
            ->where('user_id', $request->user()->id)
            ->with('replies')
            ->latest()
            ->get()
            ->map(fn (Complaint $c) => $this->payload($c));

        return response()->json($complaints);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()->with('replies')->findOrFail($id);

        abort_unless($complaint->user_id === $request->user()->id, 403);

        return response()->json($this->payload($complaint));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:complaint,refund_request'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
        ]);

        if ($data['type'] === 'refund_request' && empty($data['booking_id'])) {
            return response()->json(['message' => 'Booking is required for refund requests.'], 422);
        }

        if (! empty($data['booking_id'])) {
            $booking = Booking::query()->find($data['booking_id']);
            abort_unless($booking && $booking->user_id === $request->user()->id, 403);
        }

        $localized = fn (string $value): array => ['fr' => $value, 'ar' => $value, 'en' => $value];

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'subject' => $localized($data['subject']),
            'description' => $localized($data['description']),
            'booking_id' => $data['booking_id'] ?? null,
            'status' => 'pending',
            'priority' => 'medium',
        ]);

        User::query()
            ->where('active', true)
            ->whereIn('role', ['admin'])
            ->get()
            ->each(function (User $recipient) use ($complaint): void {
                $recipient->notify(new ComplaintNotification($complaint));
            });

        return response()->json($this->payload($complaint), 201);
    }

    /**
     * Client adds a reply to their complaint.
     */
    public function reply(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()->findOrFail($id);

        abort_unless($complaint->user_id === $request->user()->id, 403);
        abort_if(in_array($complaint->status, ['resolved', 'rejected', 'refunded']), 422, 'This complaint is closed.');

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $localized = fn (string $value): array => ['fr' => $value, 'ar' => $value, 'en' => $value];

        ComplaintReply::create([
            'complaint_id' => $complaint->id,
            'sender' => 'client',
            'message' => $localized($data['message']),
        ]);

        // Notify admin of client reply
        User::query()
            ->where('active', true)
            ->whereIn('role', ['admin'])
            ->get()
            ->each(function (User $admin) use ($complaint): void {
                $admin->notify(new ComplaintNotification($complaint));
            });

        return response()->json($this->payload($complaint->refresh()));
    }

    private function payload(Complaint $complaint): array
    {
        return [
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
                'start_date' => $complaint->booking->start_date?->toDateString(),
                'end_date' => $complaint->booking->end_date?->toDateString(),
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
            ]),
            'resolved_at' => $complaint->resolved_at?->toJSON(),
            'created_at' => $complaint->created_at?->toJSON(),
        ];
    }
}
