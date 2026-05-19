<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\BookingStatusNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class AssistantController extends Controller
{
    public function summary(): JsonResponse
    {
        return response()->json(Cache::remember('assistant.summary', now()->addMinutes(2), fn () => [
            'newInquiries' => SupportInquiry::query()->where('status', 'new')->count(),
            'pendingBookings' => Booking::query()->where('status', 'Pending')->count(),
            'activeClients' => User::query()->where('role', 'client')->where('active', true)->count(),
            'resolvedToday' => SupportInquiry::query()->whereDate('resolved_at', now()->toDateString())->count(),
        ]));
    }

    public function inquiries(): JsonResponse
    {
        return response()->json(SupportInquiry::query()->latest()->get()->map(fn (SupportInquiry $inquiry) => $this->inquiryPayload($inquiry)));
    }

    public function updateInquiry(Request $request, SupportInquiry $inquiry): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,in-progress,resolved'],
            'priority' => ['sometimes', 'in:low,medium,high'],
        ]);

        $inquiry->update([
            ...$data,
            'assigned_to' => $request->user()->id,
            'resolved_at' => $data['status'] === 'resolved' ? now() : null,
        ]);
        Cache::forget('assistant.summary');

        return response()->json($this->inquiryPayload($inquiry->refresh()));
    }

    public function reply(Request $request, SupportInquiry $inquiry): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $replies = $inquiry->replies ?? [];
        $replies[] = [
            'author_id' => $request->user()->id,
            'author' => $request->user()->name,
            'message' => $data['message'],
            'created_at' => now()->toJSON(),
        ];

        $inquiry->update([
            'assigned_to' => $request->user()->id,
            'status' => $inquiry->status === 'new' ? 'in-progress' : $inquiry->status,
            'replies' => $replies,
        ]);
        Cache::forget('assistant.summary');

        return response()->json($this->inquiryPayload($inquiry->refresh()));
    }

    public function bookings(): JsonResponse
    {
        return response()->json(Booking::query()->latest()->get()->map(fn (Booking $booking) => [
            'id' => $booking->id,
            'client' => $booking->client,
            'type' => $booking->type,
            'items' => $booking->items ?? [],
            'start_date' => $this->dateString($booking->start_date),
            'end_date' => $this->dateString($booking->end_date),
            'total_amount' => $booking->total_amount,
            'status' => $booking->status,
            'created_at' => $booking->created_at?->toJSON(),
        ]));
    }

    public function confirmBooking(Booking $booking): JsonResponse
    {
        $booking->update(['status' => 'Confirmed', 'confirmed_at' => now(), 'cancelled_at' => null]);
        Payment::query()->firstOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id' => $booking->user_id,
                'amount' => $booking->total_amount,
                'currency' => 'USD',
                'status' => 'paid',
                'paid_at' => now(),
                'reference' => 'PAY-'.$booking->id.'-'.now()->format('YmdHis'),
            ]
        );
        $user = User::query()->find($booking->user_id);
        if ($user) {
            $notification = new BookingStatusNotification($booking->refresh());
            $user->notify($notification);
            $this->publishNotification($user, $notification);
        }
        Cache::forget('assistant.summary');

        return response()->json(['message' => 'confirmed']);
    }

    public function cancelBooking(Booking $booking): JsonResponse
    {
        $booking->update(['status' => 'Cancelled', 'cancelled_at' => now()]);
        $user = User::query()->find($booking->user_id);
        if ($user) {
            $notification = new BookingStatusNotification($booking->refresh());
            $user->notify($notification);
            $this->publishNotification($user, $notification);
        }
        Cache::forget('assistant.summary');

        return response()->json(['message' => 'cancelled']);
    }

    public function clients(): JsonResponse
    {
        return response()->json(User::query()->where('role', 'client')->oldest('name')->get()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'active' => $user->active,
            'joined' => $this->dateString($user->created_at),
            'bookings' => Booking::query()->where('user_id', $user->id)->count(),
        ]));
    }

    public function status(Request $request): JsonResponse
    {
        $data = $request->validate([
            'available' => ['required', 'boolean'],
        ]);

        Cache::put('assistant.status.'.$request->user()->id, $data['available'], now()->addDay());

        return response()->json(['available' => $data['available']]);
    }

    private function inquiryPayload(SupportInquiry $inquiry): array
    {
        return [
            'id' => $inquiry->id,
            'client' => $inquiry->client,
            'subject' => $inquiry->subject,
            'message' => $inquiry->message,
            'status' => $inquiry->status,
            'priority' => $inquiry->priority,
            'replies' => $inquiry->replies ?? [],
            'created_at' => $inquiry->created_at?->toJSON(),
        ];
    }

    private function dateString(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        return Carbon::parse($value)->toDateString();
    }

    private function publishNotification(User $user, object $notification): void
    {
        try {
            if (! method_exists($notification, 'toDatabase')) {
                return;
            }

            $data = $notification->toDatabase($user);
            Redis::publish("notifications:user:{$user->id}", json_encode([
                'notification' => [
                    'id' => (string) ($data['id'] ?? $user->id.'-'.now()->timestamp),
                    'type' => $data['type'] ?? class_basename($notification::class),
                    'data' => $data,
                    'read_at' => null,
                    'created_at' => now()->toJSON(),
                ],
            ]));
        } catch (\Throwable $e) {
            // ignore
        }
    }
}
