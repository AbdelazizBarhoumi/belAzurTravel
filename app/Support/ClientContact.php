<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\User;

/**
 * Best-known contact details for a client.
 *
 * Bookings and inquiries store a snapshot of the client (name/email/phone) at
 * submission time. When that snapshot is missing a phone number we fall back to
 * the most recent number the account used on a previous booking, so admins can
 * always reach the client from the queue.
 */
class ClientContact
{
    /**
     * @param  array<string, mixed>|null  $snapshot
     * @return array<string, mixed>
     */
    public static function resolve(?User $user, ?array $snapshot = null): array
    {
        $snapshot ??= [];

        $phone = self::clean($snapshot['phone'] ?? null);

        if ($phone === null && $user !== null) {
            $phone = self::latestPhone($user);
        }

        return [
            'id' => $user?->id,
            'name' => self::clean($snapshot['name'] ?? null) ?? $user?->name,
            'email' => self::clean($snapshot['email'] ?? null) ?? $user?->email,
            'phone' => $phone,
            'role' => $user?->role,
            'active' => $user ? (bool) $user->active : null,
            'member_since' => $user?->created_at?->toDateString(),
        ];
    }

    private static function clean(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    /** Latest phone number the account left on one of its bookings. */
    private static function latestPhone(User $user): ?string
    {
        $bookings = Booking::query()
            ->where('user_id', $user->id)
            ->whereNotNull('client')
            ->latest()
            ->limit(20)
            ->get(['user_id', 'client']);

        foreach ($bookings as $booking) {
            $client = $booking->client;
            $phone = is_array($client)
                ? self::clean($client['phone'] ?? null)
                : null;

            if ($phone !== null) {
                return $phone;
            }
        }

        return null;
    }
}
