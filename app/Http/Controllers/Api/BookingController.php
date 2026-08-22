<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingAction;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\Car;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\Tour;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use App\Services\OsTravel\OsTravelBookingService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Support\Facades\DB;
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

    public function show(Request $request, string $id): JsonResponse
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
            'guests' => ['nullable', 'array'],
            'promo_code' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'is_request' => ['nullable', 'boolean'],
            'details' => ['nullable', 'array'],
            'details.room_name' => ['nullable', 'string', 'max:255'],
            'details.boarding_name' => ['nullable', 'string', 'max:255'],
            'details.image' => ['nullable', 'string', 'max:2048'],
            'details.price_per_night' => ['nullable', 'numeric'],
            'details.nights' => ['nullable', 'integer'],
            'details.currency' => ['nullable', 'string', 'max:10'],
            'details.base_price' => ['nullable', 'numeric'],
            'details.final_price' => ['nullable', 'numeric'],
            'details.promo_rate' => ['nullable', 'string', 'max:64'],
            'details.not_refundable' => ['nullable', 'boolean'],
            'details.free_cancellation_until' => ['nullable', 'string', 'max:64'],
            'details.cancellation_policy' => ['nullable', 'array'],
            'details.supplements' => ['nullable', 'array'],
            'details.room_size' => ['nullable', 'numeric'],
            'details.room_capacity' => ['nullable', 'integer'],
            'details.room_features' => ['nullable', 'array'],
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
            // Search offer lock (Phase C): the dates the user actually searched,
            // captured on the detail page. store() refuses a token with dates
            // that differ, so a booking can never drift from the priced offer.
            'provider.search.check_in' => ['nullable', 'date'],
            'provider.search.check_out' => ['nullable', 'date', 'after_or_equal:provider.search.check_in'],
        ]);

        // A provider token prices a specific date window; lock the booking to it.
        if (
            $data['type'] === 'hotel'
            && ! empty($data['provider']['token'])
            && ! empty($data['provider']['search']['check_in'])
        ) {
            $searchedIn = $data['provider']['search']['check_in'];
            $searchedOut = $data['provider']['search']['check_out'];

            $mismatches = [];
            if (($data['start_date'] ?? null) !== $searchedIn) {
                $mismatches[] = 'start_date';
            }
            if (($data['end_date'] ?? null) !== $searchedOut) {
                $mismatches[] = 'end_date';
            }

            if ($mismatches !== []) {
                throw ValidationException::withMessages([
                    'start_date' => 'The booking dates must match the dates you searched. Re-run the search to change dates.',
                    'end_date' => 'The booking dates must match the dates you searched. Re-run the search to change dates.',
                ]);
            }
        }

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

        // Every reservation lands `pending` — no type auto-confirms anymore.
        // OS-TRAVEL hotels: PreBook to verify availability + final price, then
        // persist the provider context so an admin approve() can Confirm.
        // Manual hotels (Stage 2) never call the provider; both `instant` and
        // `request` modes wait for an admin to approve.
        $providerContext = null;
        $prebookTotal = null;

        if ($data['type'] === 'hotel' && empty($data['is_request'])) {
            $hotel = Hotel::query()
                ->where(fn (Builder $query) => $query
                    ->where('slug', $data['item_slug'] ?? '')
                    ->orWhere('code', $data['item_id'] ?? ''))
                ->first();

            // A provider-backed hotel uses the OS-TRAVEL flow (even when the
            // `source` column was never set). Only genuinely manual hotels —
            // no published staging row — skip the provider entirely.
            if ($hotel !== null && ! $hotel->isProviderLinked()) {
                // Manual hotel: nothing to prebook; stays pending for approval.
            } elseif ($hotel !== null && ! empty($data['provider']['token'])) {
                $staged = OsTravelHotel::query()
                    ->whereNotNull('hotel_id')
                    ->where('hotel_id', $hotel->id)
                    ->first();

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
                    'options' => $data['provider']['options'] ?? [],
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
        }

        $expiryHours = (int) (SiteSetting::first()?->booking_expiry_hours ?? 72);

        $nextRef = (int) (DB::table('bookings')->max('booking_ref') ?? 0) + 1;

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
            'guests' => $data['guests'] ?? null,
            'promo_code' => $data['promo_code'] ?? null,
            'notes' => $data['notes'] ?? null,
            'total_amount' => $prebookTotal ?? (int) $data['amount'],
            'status' => BookingStatus::Pending->value,
            'expires_at' => now()->addHours($expiryHours),
            'is_request' => ! empty($data['is_request']),
            'provider_payload' => $providerContext,
            'details' => $data['details'] ?? null,
            'booking_ref' => $nextRef,
        ]);

        BookingAudit::log(
            booking: $booking,
            action: BookingAction::Created,
            from: null,
            to: BookingStatus::Pending,
            actor: $request->user(),
            notes: 'Booking submitted',
        );

        $this->notifyOperations($booking, 'booking.submitted');

        return response()->json($this->payload($booking->refresh()), 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
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

        // Idempotency: cancelling an already-cancelled booking is a no-op and
        // must not hit the provider again.
        if ($booking->status === 'Cancelled') {
            return response()->json($this->payload($booking));
        }

        $reason = $request->input('reason');

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

            $fromStatus = $booking->statusEnum();

            try {
                $result = $this->osTravelBookingService->cancel($booking, $bookingContext);
            } catch (Throwable $e) {
                throw ValidationException::withMessages([
                    'cancellation' => __('messages.booking_cancel_failed'),
                ]);
            }

            $booking->refresh();

            BookingAudit::log(
                booking: $booking,
                action: BookingAction::Cancelled,
                from: $fromStatus,
                to: $booking->statusEnum(),
                actor: $request->user(),
                notes: $reason,
            );

            if ($result['status'] === 'Cancelled' && $reason) {
                $booking->update(['cancel_reason' => $reason]);
            }

            $this->notifyOperations($booking, 'booking.cancelled');
            $this->notifyClient($booking);

            return response()->json(array_merge($this->payload($booking), [
                'cancellation_penalty' => $preview['fees'] ?? [],
                'provider_status' => $result['status'],
            ]));
        }

        $booking->transitionTo(BookingStatus::Cancelled, $request->user(), $reason);

        $this->notifyOperations($booking->refresh(), 'booking.cancelled');
        $this->notifyClient($booking);

        return response()->json($this->payload($booking->refresh()));
    }

    /**
     * Approve a pending demand. Sets `approved` and, unless the provider kept
     * the reservation OnRequest, `confirmed` right away (payment is deferred).
     *
     * OS-TRAVEL hotels are re-prebooked to re-verify the offer token before
     * calling confirm(); a stale token fails gracefully and keeps the booking
     * pending for the client to re-search.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);
        $actor = $request->user();

        abort_unless(in_array($booking->status, ['Pending', 'Approved'], true), 422, 'Only a pending or approved booking can be approved.');

        $isProviderBooking = $booking->type === 'hotel'
            && $this->osTravelBookingService->providerContextFromPayload($booking) !== null;

        if ($isProviderBooking) {
            $hotelBooking = $this->osTravelBookingService->providerContextFromPayload($booking);

            // Re-verify the offer token before confirming; a stale token means
            // the client must re-search.
            if (! $booking->provider_booking_id) {
                try {
                    $this->osTravelBookingService->preBook($hotelBooking);
                } catch (Throwable $e) {
                    BookingAudit::log(
                        booking: $booking,
                        action: BookingAction::Updated,
                        from: $booking->statusEnum(),
                        to: $booking->statusEnum(),
                        actor: $actor,
                        notes: 'Provider prebook failed — offer expired, client must re-search.',
                    );

                    throw ValidationException::withMessages([
                        'provider' => __('messages.booking_offer_expired'),
                    ]);
                }
            }

            try {
                $result = $this->osTravelBookingService->confirm($booking, $hotelBooking);
            } catch (Throwable $e) {
                throw ValidationException::withMessages([
                    'provider' => __('messages.booking_confirm_failed'),
                ]);
            }

            $booking->refresh();

            if ($result['status'] === 'Confirmed') {
                $from = $booking->statusEnum();
                if ($from === BookingStatus::Pending) {
                    $booking->transitionTo(BookingStatus::Approved, $actor, 'Approved');
                }
                $booking->refresh();
                $booking->transitionTo(BookingStatus::Confirmed, $actor, 'Provider confirmed');

                $this->notifyOperations($booking->refresh(), 'booking.confirmed');
                $this->notifyClient($booking);

                return response()->json($this->payload($booking->refresh()));
            }

            // Provider kept the reservation OnRequest — the booking stays
            // `approved` until the provider finalises it.
            if ($booking->statusEnum() === BookingStatus::Pending) {
                $booking->transitionTo(BookingStatus::Approved, $actor, 'Approved — awaiting provider confirmation');
            }

            $this->notifyOperations($booking->refresh(), 'booking.approved');
            $this->notifyClient($booking);

            return response()->json($this->payload($booking->refresh()));
        }

        // Local bookings: approve then confirm atomically (payment deferred).
        if ($booking->statusEnum() === BookingStatus::Pending) {
            $booking->transitionTo(BookingStatus::Approved, $actor, 'Approved');
            $booking->refresh();
        }
        $booking->transitionTo(BookingStatus::Confirmed, $actor, 'Confirmed');

        $this->notifyOperations($booking->refresh(), 'booking.confirmed');
        $this->notifyClient($booking);

        return response()->json($this->payload($booking->refresh()));
    }

    /**
     * Reject a pending demand. A reason is required and surfaced to the client.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $booking = Booking::query()->findOrFail($id);
        $actor = $request->user();

        abort_unless(in_array($booking->status, ['Pending', 'Approved'], true), 422, 'Only a pending or approved booking can be rejected.');

        $booking->transitionTo(BookingStatus::Rejected, $actor, $data['reason']);

        $this->notifyOperations($booking->refresh(), 'booking.rejected');
        $this->notifyClient($booking);

        return response()->json($this->payload($booking->refresh()));
    }

    /**
     * Backwards-compatible alias used by the existing admin UI.
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        return $this->approve($request, $id);
    }

    public function adminCancel(Request $request, string $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);

        $reason = $request->input('reason');

        // Provider-backed bookings cancelled by an admin stay local: the
        // reservation itself is not re-sent to the provider (ops handles it).
        $booking->transitionTo(BookingStatus::Cancelled, $request->user(), $reason);

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

    /** @return array<string, mixed> */
    private function payload(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'booking_ref' => $booking->booking_ref,
            'user_id' => $booking->user_id,
            'type' => $booking->type,
            'item_slug' => $booking->item_slug,
            'item_id' => $booking->item_id,
            'items' => $booking->items ?? [],
            'start_date' => $this->dateString($booking->start_date),
            'end_date' => $this->dateString($booking->end_date),
            'client' => $booking->client,
            'guests' => $booking->guests,
            'promo_code' => $booking->promo_code,
            'notes' => $booking->notes,
            'amount' => $booking->total_amount,
            'total_amount' => $booking->total_amount,
            'status' => $booking->status,
            'created_at' => $booking->created_at?->toJSON(),
            'confirmed_at' => $booking->confirmed_at?->toJSON(),
            'cancelled_at' => $booking->cancelled_at?->toJSON(),
            'rejected_at' => $booking->rejected_at?->toJSON(),
            'expires_at' => $booking->expires_at?->toJSON(),
            'reject_reason' => $booking->reject_reason,
            'cancel_reason' => $booking->cancel_reason,
            'is_request' => (bool) $booking->is_request,
            'provider_booking_id' => $booking->provider_booking_id,
            'provider_booking_reference' => $booking->provider_booking_reference,
            'provider_prebook' => $booking->provider_payload['prebook'] ?? null,
            'can_cancel' => in_array($booking->status, ['Pending', 'Approved', 'Confirmed'], true)
                && (! $booking->start_date || now()->lt(Carbon::parse($booking->start_date)->subDay())),
            'details' => $booking->details,
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
