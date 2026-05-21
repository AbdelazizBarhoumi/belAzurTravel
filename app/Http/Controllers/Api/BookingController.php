<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Booking::query()->latest()->get()->map(fn (Booking $booking) => $this->payload($booking)));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);

        $user = $request->user();
        abort_unless(
            $user && ($booking->user_id === $user->id || $user->role === 'admin' || $user->role === 'assistant'),
            403
        );

        return response()->json($this->payload($booking));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:destination,hotel,tour,flight,car'],
            'item_slug' => ['nullable', 'string', 'max:255', 'required_without:item_id'],
            'item_id' => ['nullable', 'string', 'max:255', 'required_without:item_slug'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'client.name' => ['required', 'string', 'max:255'],
            'client.email' => ['required', 'email', 'max:255'],
            'client.phone' => ['nullable', 'string', 'max:64'],
            'travelers' => ['nullable', 'array'],
            'promo_code' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $this->findBookable($data['type'], $data['item_slug'] ?? $data['item_id']);

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'item_slug' => $data['item_slug'] ?? null,
            'item_id' => $data['item_id'] ?? null,
            'items' => [[
                'slug' => $data['item_slug'] ?? null,
                'id' => $data['item_id'] ?? null,
                'qty' => 1,
            ]],
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'client' => $data['client'],
            'travelers' => $data['travelers'] ?? null,
            'promo_code' => $data['promo_code'] ?? null,
            'notes' => $data['notes'] ?? null,
            'total_amount' => (int) $data['amount'],
            'status' => 'Pending',
        ]);

        $this->notifyOperations($booking, 'booking.created');

        return response()->json($this->payload($booking), 201);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);

        abort_unless($booking->user_id === $request->user()->id || $request->user()->can('admin'), 403);
        abort_if(
            $request->user()->role === 'client'
            && $booking->start_date
            && now()->gte(Carbon::parse($booking->start_date)->subDay()),
            422,
            'Cancellation is closed within 24 hours of travel.'
        );

        $booking->update([
            'status' => 'Cancelled',
            'cancelled_at' => now(),
        ]);

        $this->notifyOperations($booking->refresh(), 'booking.cancelled');
        $this->notifyClient($booking);

        return response()->json($this->payload($booking->refresh()));
    }

    public function confirm(int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);
        $booking->update([
            'status' => 'Confirmed',
            'confirmed_at' => now(),
            'cancelled_at' => null,
        ]);
        $this->recordPayment($booking->refresh());

        $this->notifyOperations($booking->refresh(), 'booking.confirmed');
        $this->notifyClient($booking);

        return response()->json($this->payload($booking->refresh()));
    }

    public function adminCancel(int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);
        $booking->update([
            'status' => 'Cancelled',
            'cancelled_at' => now(),
        ]);

        $this->notifyOperations($booking->refresh(), 'booking.cancelled');
        $this->notifyClient($booking);

        return response()->json($this->payload($booking->refresh()));
    }

    private function findBookable(string $type, ?string $identifier): void
    {
        $query = match ($type) {
            'destination' => Destination::query()->where('slug', $identifier),
            'hotel' => Hotel::query()->where(fn (Builder $query) => $query->where('slug', $identifier)->orWhere('code', $identifier)),
            'tour' => Tour::query()->where('slug', $identifier),
            'flight' => Flight::query()->where('code', $identifier),
            'car' => Car::query()->where('slug', $identifier),
            default => null,
        };

        abort_unless($query?->exists(), 422, 'Selected item does not exist.');
    }

    private function notifyOperations(Booking $booking, string $type): void
    {
        User::query()
            ->where('active', true)
            ->whereIn('role', ['admin', 'assistant'])
            ->get()
            ->each(function (User $recipient) use ($booking, $type): void {
                $notification = new BookingActivityNotification($booking, $type);
            $recipient->notify($notification);
            });
    }

    private function notifyClient(Booking $booking): void
    {
        if (! $booking->user_id) {
            return;
        }

        $user = User::query()->find($booking->user_id);
        if ($user) {
            $notification = new BookingStatusNotification($booking);
            $user->notify($notification);
        }
    }

    private function recordPayment(Booking $booking): void
    {
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
    }

    /** @return array<string, mixed> */
    private function payload(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'user_id' => $booking->user_id,
            'type' => $booking->type,
            'item_slug' => $booking->item_slug,
            'item_id' => $booking->item_id,
            'items' => $booking->items ?? [],
            'start_date' => $this->dateString($booking->start_date),
            'end_date' => $this->dateString($booking->end_date),
            'client' => $booking->client,
            'travelers' => $booking->travelers,
            'promo_code' => $booking->promo_code,
            'notes' => $booking->notes,
            'amount' => $booking->total_amount,
            'total_amount' => $booking->total_amount,
            'status' => $booking->status,
            'created_at' => $booking->created_at?->toJSON(),
            'confirmed_at' => $booking->confirmed_at?->toJSON(),
            'cancelled_at' => $booking->cancelled_at?->toJSON(),
            'can_cancel' => $booking->status !== 'Cancelled'
                && (! $booking->start_date || now()->lt(Carbon::parse($booking->start_date)->subDay())),
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
