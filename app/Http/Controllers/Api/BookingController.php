<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\Payment;
use App\Models\Promo;
use App\Models\Tour;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use App\Services\OsTravel\OsTravelBookingService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class BookingController extends Controller
{
    public function __construct(
        private readonly OsTravelBookingService $osTravelBookingService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(Booking::query()->latest()->get()->map(fn (Booking $booking) => $this->payload($booking)));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);

        $user = $request->user();
        abort_unless(
            $user && ($booking->user_id === $user->id || $user->role === 'admin'),
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
            // OS-TRAVEL live-search context captured during Phase 9.
            'provider.token' => ['nullable', 'string', 'max:2048'],
            'provider.source' => ['nullable', 'string', 'max:255'],
            'provider.rooms' => ['nullable', 'array', 'min:1'],
            'provider.rooms.*.id' => ['required', 'integer'],
            'provider.rooms.*.boarding_id' => ['nullable', 'integer'],
            'provider.rooms.*.view_ids' => ['nullable', 'array'],
            'provider.rooms.*.view_ids.*' => ['integer'],
            'provider.rooms.*.supplements' => ['nullable', 'array'],
            'provider.pax.adults' => ['nullable', 'array'],
            'provider.pax.children' => ['nullable', 'array'],
        ]);

        if (! empty($data['promo_code'])) {
            $promo = Promo::where('code', $data['promo_code'])->first();
            if (! $promo) {
                throw ValidationException::withMessages(['promo_code' => __('messages.promo_invalid')]);
            }
            if (isset($promo->details['active']) && $promo->details['active'] === false) {
                throw ValidationException::withMessages(['promo_code' => __('messages.promo_inactive')]);
            }
            if (! empty($promo->details['applicable_to']) && $promo->details['applicable_to'] !== 'all' && $promo->details['applicable_to'] !== $data['type']) {
                throw ValidationException::withMessages(['promo_code' => __('messages.promo_not_applicable')]);
            }
            $usageCount = Booking::where('promo_code', $data['promo_code'])->count();
            if (! empty($promo->details['usage_limit']) && (int) $promo->details['usage_limit'] > 0 && $usageCount >= (int) $promo->details['usage_limit']) {
                throw ValidationException::withMessages(['promo_code' => __('messages.promo_usage_limit_reached')]);
            }
            $userUsageCount = Booking::where('promo_code', $data['promo_code'])->where('user_id', $request->user()->id)->count();
            $perUserLimit = $promo->details['per_user_limit'] ?? 1;
            if ((int) $perUserLimit > 0 && $userUsageCount >= (int) $perUserLimit) {
                throw ValidationException::withMessages(['promo_code' => __('messages.promo_already_used')]);
            }
        }

        $this->findBookable($data['type'], $data['item_slug'] ?? $data['item_id']);

        // OS-TRAVEL hotel: PreBook to verify availability + final price, then
        // persist the provider context so the payment callback can Confirm.
        $providerContext = null;
        $prebookTotal = null;
        if ($data['type'] === 'hotel' && ! empty($data['provider']['token'])) {
            $hotel = Hotel::query()->where('slug', $data['item_slug'])->first();
            $staged = $hotel ? OsTravelHotel::query()
                ->where('status', OsTravelHotel::PUBLISHED)
                ->where('hotel_id', $hotel->id)
                ->first() : null;

            if (! $staged) {
                throw ValidationException::withMessages(['provider' => __('messages.hotel_not_available')]);
            }

            $hotelBooking = $this->osTravelBookingService->buildHotelBooking([
                'city' => $staged->city_external_id,
                'hotel' => $staged->external_id,
                'check_in' => $data['start_date'],
                'check_out' => $data['end_date'],
                'source' => $data['provider']['source'],
                'token' => $data['provider']['token'],
                'rooms' => $data['provider']['rooms'] ?? [],
            ], $data['provider']['pax'] ?? []);

            try {
                $prebook = $this->osTravelBookingService->preBook($hotelBooking);
            } catch (Throwable $e) {
                throw ValidationException::withMessages([
                    'provider' => __('messages.booking_prebook_failed'),
                ]);
            }

            $providerContext = [
                'request' => $hotelBooking,
                'prebook' => $prebook,
            ];
            $prebookTotal = $prebook['total'] > 0
                ? (int) round($prebook['total'] * (1 + ($hotel->markup_percentage ? (float) $hotel->markup_percentage : 0) / 100))
                : (int) $data['amount'];
        }

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
            'total_amount' => $prebookTotal ?? (int) $data['amount'],
            'status' => 'Pending',
            'provider_payload' => $providerContext,
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
            __('messages.cancellation_closed')
        );

        // OS-TRAVEL hotel: preview the penalty, then confirm the cancellation
        // with the provider. Cancel on an already-cancelled booking is a no-op.
        if ($booking->type === 'hotel' && $booking->provider_booking_id) {
            $bookingContext = $this->osTravelBookingService->providerContextFromPayload($booking);
            $bookingContext = array_merge($bookingContext ?? [], [
                'Id' => $booking->provider_booking_id,
            ]);

            try {
                $preview = $this->osTravelBookingService->previewCancellation($bookingContext);
            } catch (Throwable $e) {
                throw ValidationException::withMessages([
                    'cancellation' => __('messages.booking_cancel_failed'),
                ]);
            }

            try {
                $result = $this->osTravelBookingService->cancel($booking, $bookingContext);
            } catch (Throwable $e) {
                throw ValidationException::withMessages([
                    'cancellation' => __('messages.booking_cancel_failed'),
                ]);
            }

            $booking->refresh();
            $this->notifyOperations($booking, 'booking.cancelled');
            $this->notifyClient($booking);

            return response()->json(array_merge($this->payload($booking), [
                'cancellation_penalty' => $preview['fees'] ?? [],
                'provider_status' => $result['status'],
            ]));
        }

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

        abort_unless($query?->exists(), 422, __('messages.selected_item_missing'));
    }

    private function notifyOperations(Booking $booking, string $type): void
    {
        User::query()
            ->where('active', true)
            ->whereIn('role', ['admin'])
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
                'currency' => 'TND',
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
            'provider_booking_id' => $booking->provider_booking_id,
            'provider_booking_reference' => $booking->provider_booking_reference,
            'provider_prebook' => $booking->provider_payload['prebook'] ?? null,
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
