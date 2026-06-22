<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\ComplaintReply;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\ComplaintReplyNotification;
use App\Notifications\ComplaintResolvedNotification;
use App\Notifications\RefundApprovedNotification;
use App\Services\ClictoPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminComplaintController extends Controller
{
    public function __construct(
        private readonly ClictoPayService $clictoPay,
    ) {}

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
        $complaint = Complaint::query()->with('booking')->findOrFail($id);

        $data = $request->validate([
            'status' => ['sometimes', 'in:pending,in_review,resolved,rejected,refunded'],
            'priority' => ['sometimes', 'in:low,medium,high'],
            'refund_amount' => ['nullable', 'integer', 'min:0'],
        ]);

        $previousStatus = $complaint->status;

        $complaint->update($data);

        if (in_array($data['status'] ?? '', ['resolved', 'rejected']) && ! $complaint->resolved_at) {
            $complaint->update(['resolved_at' => now()]);

            // Notify client of resolution/rejection
            if ($complaint->user_id) {
                $client = User::find($complaint->user_id);
                if ($client) {
                    $client->notify(new ComplaintResolvedNotification($complaint, $data['status']));
                }
            }
        }

        // Process refund through ClictoPay
        if (($data['status'] ?? '') === 'refunded' && $complaint->type === 'refund_request') {
            $refundResult = $this->processRefund($complaint);

            if ($refundResult['success']) {
                // Update booking status
                if ($complaint->booking) {
                    $complaint->booking->update([
                        'status' => 'Cancelled',
                        'cancelled_at' => now(),
                    ]);
                }

                // Update payment status
                $payment = Payment::where('booking_id', $complaint->booking_id)
                    ->where('status', 'paid')
                    ->first();

                if ($payment) {
                    $payment->update([
                        'status' => 'refunded',
                    ]);
                }

                // Notify client
                if ($complaint->user_id) {
                    $client = User::find($complaint->user_id);
                    if ($client && $complaint->booking) {
                        $client->notify(new RefundApprovedNotification($complaint, $complaint->booking));
                    }
                }

                $complaint->update(['resolved_at' => now()]);
            } else {
                Log::error('Refund processing failed', [
                    'complaint_id' => $complaint->id,
                    'error' => $refundResult['error'],
                ]);

                // Revert status if refund failed
                $complaint->update(['status' => $previousStatus]);

                return response()->json([
                    'message' => 'Refund processing failed. Please try again.',
                    'error' => $refundResult['error'],
                ], 500);
            }
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

        // Create reply record
        ComplaintReply::create([
            'complaint_id' => $complaint->id,
            'sender' => 'admin',
            'message' => $localized($data['message']),
        ]);

        // Also keep admin_reply for backward compatibility
        $complaint->update([
            'admin_reply' => $localized($data['message']),
            'status' => 'in_review',
        ]);

        if ($complaint->user_id) {
            $user = User::query()->find($complaint->user_id);
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

        // Notify client
        if ($complaint->user_id) {
            $client = User::find($complaint->user_id);
            if ($client) {
                $client->notify(new ComplaintResolvedNotification($complaint, 'resolved'));
            }
        }

        return response()->json($this->payload($complaint->refresh()));
    }

    /**
     * Process refund through ClictoPay gateway.
     */
    private function processRefund(Complaint $complaint): array
    {
        if (! $complaint->booking) {
            return ['success' => false, 'error' => 'Booking not found'];
        }

        $payment = Payment::where('booking_id', $complaint->booking_id)
            ->where('status', 'paid')
            ->first();

        if (! $payment || ! $payment->clictopay_order_id) {
            return ['success' => false, 'error' => 'No paid payment found for this booking'];
        }

        try {
            $refundAmount = $complaint->refund_amount ?? $complaint->booking->total_amount;
            $result = $this->clictoPay->refundPayment(
                $payment->clictopay_order_id,
                $refundAmount,
            );

            return ['success' => $result['status'] === 'refunded', 'error' => null];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
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
