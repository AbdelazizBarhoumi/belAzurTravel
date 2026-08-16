import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
