<?php

namespace App\Models;

use App\Casts\GuestsWithEncryptedPassports;
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

    protected $casts = ['items' => 'array', 'client' => 'array', 'guests' => GuestsWithEncryptedPassports::class, 'start_date' => 'date', 'end_date' => 'date', 'total_amount' => 'integer', 'confirmed_at' => 'datetime', 'cancelled_at' => 'datetime', 'rejected_at' => 'datetime', 'expires_at' => 'datetime', 'is_request' => 'boolean', 'provider_payload' => 'array', 'details' => 'array'];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Booking $booking) {
            if (empty($booking->booking_ref)) {
                $booking->booking_ref = 'BK-'.strtoupper(substr(sha1($booking->id ?? uniqid()), 0, 8));
            }
        });
    }

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

    /**
     * The provider prebook as a client may see it: supplier (net) prices are
     * rescaled to the marked-up booking total so the margin never leaks.
     *
     * @return array<string, mixed>|null
     */
    public function clientPrebook(): ?array
    {
        $prebook = $this->provider_payload['prebook'] ?? null;
        if (! is_array($prebook)) {
            return null;
        }

        $net = (float) ($prebook['total'] ?? 0);
        $ratio = $net > 0 ? (float) $this->total_amount / $net : 1.0;
        $scale = fn ($value) => is_numeric($value) ? round((float) $value * $ratio, 2) : $value;

        $breakdown = $prebook['breakdown'] ?? null;
        if (is_array($breakdown)) {
            foreach (['total', 'price_per_night'] as $key) {
                if (array_key_exists($key, $breakdown)) {
                    $breakdown[$key] = $scale($breakdown[$key]);
                }
            }
            $breakdown['rooms'] = array_map(function ($room) use ($scale) {
                if (! is_array($room)) {
                    return $room;
                }
                foreach (['total', 'price_per_night'] as $key) {
                    if (array_key_exists($key, $room)) {
                        $room[$key] = $scale($room[$key]);
                    }
                }

                return $room;
            }, $breakdown['rooms'] ?? []);
        }

        return [
            'total' => $this->total_amount,
            'currency' => $prebook['currency'] ?? null,
            'breakdown' => $breakdown,
        ];
    }
}
