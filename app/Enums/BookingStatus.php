<?php

namespace App\Enums;

/**
 * Booking lifecycle states for the demand approval pipeline.
 *
 * The column stays a plain string for backwards compatibility with existing
 * code and data; this enum is the single source of truth for the vocabulary
 * and the allowed transitions between states.
 */
enum BookingStatus: string
{
    case Pending = 'Pending';
    case Approved = 'Approved';
    case Confirmed = 'Confirmed';
    case Rejected = 'Rejected';
    case Cancelled = 'Cancelled';
    case Expired = 'Expired';
    case Completed = 'Completed';

    /**
     * States from which no further transition is allowed.
     */
    public function isTerminal(): bool
    {
        return match ($this) {
            self::Rejected, self::Cancelled, self::Expired, self::Completed => true,
            default => false,
        };
    }

    /**
     * States reachable directly from this state.
     *
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Approved, self::Rejected, self::Cancelled, self::Expired],
            self::Approved => [self::Confirmed, self::Rejected, self::Cancelled],
            self::Confirmed => [self::Cancelled, self::Completed],
            self::Rejected, self::Cancelled, self::Expired, self::Completed => [],
        };
    }

    /**
     * Whether the booking may move from this state to the given state.
     */
    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->allowedTransitions(), true);
    }
}
