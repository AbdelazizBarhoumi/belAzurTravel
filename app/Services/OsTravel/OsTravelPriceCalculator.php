<?php

namespace App\Services\OsTravel;

use Illuminate\Support\Carbon;

/**
 * Single source of truth for hotel pricing math.
 *
 * OS-TRAVEL returns TOTAL-stay prices (all nights × pax for a room), so the
 * public price is always derived from a stay total and the per-night figure
 * is computed from it — never stored as if it were a nightly rate.
 */
class OsTravelPriceCalculator
{
    /**
     * Apply the partner markup to a raw provider price (a stay total).
     *
     * @param  float|int  $basePrice  Raw provider price.
     * @param  float|int  $markupPercent  Markup as a percentage (e.g. 20 = +20%).
     */
    public function applyMarkup(float|int $basePrice, float|int $markupPercent): int
    {
        return (int) round($basePrice * (1 + $markupPercent / 100));
    }

    /**
     * Derive the per-night figure from a stay total.
     *
     * @param  float|int  $total  Stay total (already marked up or raw).
     */
    public function perNight(float|int $total, int $nights): float
    {
        if ($nights <= 0) {
            return 0.0;
        }

        return round($total / $nights, 2);
    }

    /**
     * Number of nights between check-in and check-out (inclusive of the
     * check-out day's departure). Returns 0 when the range is invalid.
     */
    public function nightsBetween(?string $checkIn, ?string $checkOut): int
    {
        if (! $checkIn || ! $checkOut) {
            return 0;
        }

        try {
            $start = Carbon::parse($checkIn)->startOfDay();
            $end = Carbon::parse($checkOut)->startOfDay();
        } catch (\Throwable) {
            return 0;
        }

        $nights = $start->diffInDays($end);

        return $nights > 0 ? $nights : 0;
    }

    /**
     * Currency for a provider price, falling back to the configured default
     * when the provider does not send one.
     *
     * @param  string|int|mixed  $providerCurrency
     */
    public function currency(mixed $providerCurrency): string
    {
        $currency = is_scalar($providerCurrency) ? (string) $providerCurrency : '';

        return $currency !== '' ? strtoupper($currency) : (string) config('ostravel.currency.default', 'TND');
    }
}
