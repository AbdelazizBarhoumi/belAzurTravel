<?php

namespace App\Models;

use App\Enums\BookingAction;
use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAudit extends Model
{
    protected $fillable = ['booking_id', 'actor_id', 'actor_role', 'action', 'from_status', 'to_status', 'notes'];

    protected $casts = [
        'from_status' => BookingStatus::class,
        'to_status' => BookingStatus::class,
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Record an entry on the audit trail.
     */
    public static function log(
        Booking $booking,
        BookingAction $action,
        ?BookingStatus $from = null,
        ?BookingStatus $to = null,
        ?User $actor = null,
        ?string $notes = null,
    ): self {
        return static::create([
            'booking_id' => $booking->id,
            'actor_id' => $actor?->id,
            'actor_role' => $actor?->role,
            'action' => $action->value,
            'from_status' => $from?->value,
            'to_status' => $to?->value,
            'notes' => $notes,
        ]);
    }
}
