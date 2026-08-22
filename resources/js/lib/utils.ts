import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// `children` is a comma-separated list of child ages (e.g. "5,8") carried in
// the URL to preserve occupancy across the list <-> detail navigation.
export const parseChildAges = (raw: string | null | undefined): number[] => {
    if (!raw) return [];
    return raw
        .split(',')
        .map((value) => Number(value))
        .filter(
            (value) => Number.isInteger(value) && value >= 0 && value <= 17,
        );
};

// Serialize a Date as YYYY-MM-DD in local time (toISOString() shifts to UTC).
export const toLocalISODate = (
    date: Date | null | undefined,
): string | undefined =>
    date
        ? [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, '0'),
              String(date.getDate()).padStart(2, '0'),
          ].join('-')
        : undefined;

// Earliest selectable check-in for a date picker: never before tomorrow
// (the provider cannot book same-day arrivals), and never before the
// earliest day the displayed hotels are available from.
export const earliestCheckIn = (
    availableDates: ReadonlyArray<string | null | undefined>,
): Date => {
    const minAvailable = availableDates
        .filter((d): d is string => Boolean(d))
        .map((d) => new Date(`${d}T00:00:00`))
        .filter((d) => !Number.isNaN(d.getTime()))
        .reduce(
            (min, d) => (min === null || d < min ? d : min),
            null as Date | null,
        );

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return minAvailable !== null && minAvailable > tomorrow
        ? minAvailable
        : tomorrow;
};

// Render the provider's promotion discount rate (a percentage string such as
// "29.00") as "-29%", or an empty string when it is missing or not a positive
// number. The rate carries no sign and no unit; the minus and percent are ours.
export const formatPromoRate = (rate?: string | null): string => {
    const value = rate ? Number.parseFloat(rate) : Number.NaN;
    if (!Number.isFinite(value) || value <= 0) {
        return '';
    }
    const digits = Number.isInteger(value)
        ? String(value)
        : String(Math.round(value * 10) / 10);

    return `-${digits}%`;
};

export interface PromoPriceSplit {
    original: number;
    discounted: number;
}

// Split a base price into its original and discounted values when a valid
// promotion rate applies. The provider prices are treated as the pre-discount
// base (BasePrice == Price in their payload), so the discounted price is the
// original minus the promotion percentage. Returns null when there is no rate
// or the price/rate are not usable.
export const promoPrice = (
    price: number | null | undefined,
    rate?: string | null,
): PromoPriceSplit | null => {
    if (price == null || !Number.isFinite(price) || price <= 0) {
        return null;
    }
    const value = rate ? Number.parseFloat(rate) : Number.NaN;
    if (!Number.isFinite(value) || value <= 0 || value >= 100) {
        return null;
    }

    return {
        original: price,
        discounted: Math.round(price * (1 - value / 100) * 100) / 100,
    };
};
