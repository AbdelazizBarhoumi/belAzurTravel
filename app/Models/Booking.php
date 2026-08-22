<?php

namespace App\Models;

use App\Enums\BookingAction;
use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = ['user_id', 'type', 'item_slug', 'item_id', 'items', 'start_date', 'end_date', 'client', 'guests', 'promo_code', 'notes', 'total_amount', 'status', 'confirmed_at', 'cancelled_at', 'rejected_at', 'expires_at', 'reject_reason', 'cancel_reason', 'is_request', 'provider_booking_id', 'provider_booking_reference', 'provider_payload', 'details', 'booking_ref'];

    protected $casts = ['items' => 'array', 'client' => 'array', 'guests' => 'array', 'start_date' => 'date', 'end_date' => 'date', 'total_amount' => 'integer', 'confirmed_at' => 'datetime', 'cancelled_at' => 'datetime', 'rejected_at' => 'datetime', 'expires_at' => 'datetime', 'is_request' => 'boolean', 'provider_payload' => 'array', 'details' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(BookingAudit::class);
    }

    public function statusEnum(): BookingStatus
    {
        return BookingStatus::from($this->status ?? BookingStatus::Pending->value);
    }

    /**
     * Move the booking to the given state, stamping the relevant timestamp,
     * and record the transition on the audit trail.
     *
     * Returns false (and changes nothing) when the transition is not allowed.
     */
    public function transitionTo(
        BookingStatus $to,
        ?User $actor = null,
        ?string $notes = null,
        ?BookingAction $action = null,
    ): bool {
        $from = $this->statusEnum();

        if (! $from->canTransitionTo($to)) {
            return false;
        }

        $updates = ['status' => $to->value];

        if ($to === BookingStatus::Confirmed) {
            $updates['confirmed_at'] = now();
            $updates['cancelled_at'] = null;
        } elseif ($to === BookingStatus::Cancelled) {
            $updates['cancelled_at'] = now();
            $updates['cancel_reason'] = $notes;
        } elseif ($to === BookingStatus::Rejected) {
            $updates['rejected_at'] = now();
            $updates['reject_reason'] = $notes;
        }

        $this->update($updates);

        BookingAudit::log(
            booking: $this,
            action: $action ?? BookingAction::fromTransition($to),
            from: $from,
            to: $to,
            actor: $actor,
            notes: $notes,
        );

        return true;
    }
}
