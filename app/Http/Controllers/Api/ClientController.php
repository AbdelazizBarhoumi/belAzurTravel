<?php

namespace App\Http\Controllers\Api;

use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\SupportInquiryNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    use ProfileValidationRules;

    public function dashboard(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'stats' => [
                'upcomingTrips' => $bookings->whereIn('status', ['Pending', 'Confirmed'])->count(),
                'totalBookings' => $bookings->count(),
                'payments' => Payment::query()->where('user_id', $request->user()->id)->count(),
                'unreadNotifications' => $request->user()->unreadNotifications()->count(),
            ],
            'bookings' => $bookings->take(8)->map(fn (Booking $booking) => $this->bookingPayload($booking))->values(),
            'notifications' => $request->user()->notifications()->latest()->limit(5)->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'data' => $notification->data,
                'read_at' => $notification->read_at?->toJSON(),
                'created_at' => $notification->created_at?->toJSON(),
            ]),
        ]);
    }

    public function bookings(Request $request): JsonResponse
    {
        return response()->json(
            Booking::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
                ->map(fn (Booking $booking) => $this->bookingPayload($booking))
        );
    }

    public function payments(Request $request): JsonResponse
    {
        return response()->json(
            Payment::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
                ->map(fn (Payment $payment) => [
                    'id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'paid_at' => $payment->paid_at?->toJSON(),
                    'reference' => $payment->reference,
                ])
        );
    }

    public function support(Request $request): JsonResponse
    {
        return response()->json(
            SupportInquiry::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
                ->map(fn (SupportInquiry $inquiry) => [
                    'id' => $inquiry->id,
                    'subject' => $inquiry->subject,
                    'message' => $inquiry->message,
                    'status' => $inquiry->status,
                    'priority' => $inquiry->priority,
                    'replies' => $inquiry->replies ?? [],
                    'created_at' => $inquiry->created_at?->toJSON(),
                ])
        );
    }

    public function createSupport(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $localizedSubject = $this->localized($data['subject']);
        $localizedMessage = $this->localized($data['message']);

        $inquiry = SupportInquiry::create([
            'user_id' => $request->user()->id,
            'client' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
            'subject' => $localizedSubject,
            'message' => $localizedMessage,
            'status' => 'new',
            'priority' => 'medium',
        ]);

        User::query()
            ->where('active', true)
            ->whereIn('role', ['admin'])
            ->get()
            ->each(function (User $recipient) use ($inquiry): void {
                $notification = new SupportInquiryNotification($inquiry);
                $recipient->notify($notification);
            });

        return response()->json(['id' => $inquiry->id], 201);
    }

    public function updateLanguage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'language' => ['required', 'in:fr,ar,en'],
        ]);

        $request->user()->update(['preferred_language' => $data['language']]);

        return response()->json(['language' => $data['language']]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate($this->profileRules($request->user()->id));

        $request->user()->update($data);

        return response()->json($request->user());
    }

    private function localized(string $value): array
    {
        return ['fr' => $value, 'ar' => $value, 'en' => $value];
    }

    private function bookingPayload(Booking $booking): array
    {
        $canCancel = $booking->status !== 'Cancelled'
            && (! $booking->start_date || now()->lt(Carbon::parse($booking->start_date)->subDay()));

        return [
            'id' => $booking->id,
            'type' => $booking->type,
            'item_slug' => $booking->item_slug,
            'item_id' => $booking->item_id,
            'items' => $booking->items ?? [],
            'start_date' => $this->dateString($booking->start_date),
            'end_date' => $this->dateString($booking->end_date),
            'client' => $booking->client,
            'total_amount' => $booking->total_amount,
            'status' => $booking->status,
            'can_cancel' => $canCancel,
            'cancel_reason' => $canCancel ? null : __('messages.cancellation_closed'),
            'created_at' => $booking->created_at?->toJSON(),
        ];
    }

    private function dateString(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        return Carbon::parse($value)->toDateString();
    }
}
