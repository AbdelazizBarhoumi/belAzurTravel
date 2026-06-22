<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Notifications\ComplaintReplyNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Complaint::query()->with('user', 'booking')->latest();

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $complaints = $query->get()->map(fn (Complaint $c) => $this->payload($c));

        return response()->json($complaints);
    }

    public function show(int $id): JsonResponse
    {
        $complaint = Complaint::query()->with('user', 'booking')->findOrFail($id);

        return response()->json($this->payload($complaint));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()->findOrFail($id);

        $data = $request->validate([
            'status' => ['sometimes', 'in:pending,in_review,resolved,rejected,refunded'],
            'priority' => ['sometimes', 'in:low,medium,high'],
            'refund_amount' => ['nullable', 'integer', 'min:0'],
        ]);

        $complaint->update($data);

        if (in_array($data['status'] ?? '', ['resolved', 'refunded']) && ! $complaint->resolved_at) {
            $complaint->update(['resolved_at' => now()]);
        }

        return response()->json($this->payload($complaint->refresh()));
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()->findOrFail($id);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $localized = fn (string $value): array => ['fr' => $value, 'ar' => $value, 'en' => $value];

        $complaint->update([
            'admin_reply' => $localized($data['message']),
            'status' => 'in_review',
        ]);

        if ($complaint->user_id) {
            $user = \App\Models\User::query()->find($complaint->user_id);
            if ($user) {
                $user->notify(new ComplaintReplyNotification($complaint));
            }
        }

        return response()->json($this->payload($complaint->refresh()));
    }

    public function resolve(int $id): JsonResponse
    {
        $complaint = Complaint::query()->findOrFail($id);

        $complaint->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

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
            'user' => $complaint->user ? [
                'id' => $complaint->user->id,
                'name' => $complaint->user->name,
                'email' => $complaint->user->email,
            ] : null,
            'refund_amount' => $complaint->refund_amount,
            'status' => $complaint->status,
            'priority' => $complaint->priority,
            'admin_reply' => $complaint->admin_reply,
            'resolved_at' => $complaint->resolved_at?->toJSON(),
            'created_at' => $complaint->created_at?->toJSON(),
        ];
    }
}
