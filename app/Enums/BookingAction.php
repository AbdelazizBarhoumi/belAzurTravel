<?php

namespace App\Enums;

/**
 * Actions recorded on the booking_audits trail.
 */
enum BookingAction: string
{
    case Created = 'created';
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    case Completed = 'completed';
    case Updated = 'updated';

    /**
     * Default action that accompanies a status transition.
     */
    public static function fromTransition(BookingStatus $to): self
    {
        return match ($to) {
            BookingStatus::Pending => self::Created,
            BookingStatus::Approved => self::Approved,
            BookingStatus::Confirmed => self::Confirmed,
            BookingStatus::Rejected => self::Rejected,
            BookingStatus::Cancelled => self::Cancelled,
            BookingStatus::Expired => self::Expired,
            BookingStatus::Completed => self::Completed,
        };
    }
}
