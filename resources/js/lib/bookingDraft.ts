/**
 * Keeps what a guest typed in the booking dialog across the login redirect,
 * so they come back to a filled form instead of starting over.
 */
export interface BookingDraft {
    name: string;
    email: string;
    phone: string;
    startDate: string | null;
    endDate: string | null;
    notes: string;
    participants: number;
}

const DRAFT_PREFIX = 'booking_draft:';
const REOPEN_PREFIX = 'booking_reopen:';

export function bookingDraftKey(type: string, item?: string | null): string {
    return `${type}:${item ?? ''}`;
}

function storage(): Storage | null {
    try {
        return typeof window !== 'undefined' ? window.sessionStorage : null;
    } catch {
        return null;
    }
}

export function saveBookingDraft(key: string, draft: BookingDraft): void {
    try {
        storage()?.setItem(DRAFT_PREFIX + key, JSON.stringify(draft));
        storage()?.setItem(REOPEN_PREFIX + key, '1');
    } catch {
        // Storage full or blocked: the guest just retypes the form.
    }
}

/** Returns the saved draft once, then forgets it. */
export function takeBookingDraft(key: string): BookingDraft | null {
    try {
        const raw = storage()?.getItem(DRAFT_PREFIX + key);
        storage()?.removeItem(DRAFT_PREFIX + key);
        return raw ? (JSON.parse(raw) as BookingDraft) : null;
    } catch {
        return null;
    }
}

/**
 * True for the first caller after a login redirect. Detail pages mount the
 * booking card twice (mobile + desktop); only one of them should reopen.
 */
export function claimBookingReopen(key: string): boolean {
    try {
        const flag = storage()?.getItem(REOPEN_PREFIX + key);
        storage()?.removeItem(REOPEN_PREFIX + key);
        return flag === '1';
    } catch {
        return false;
    }
}
