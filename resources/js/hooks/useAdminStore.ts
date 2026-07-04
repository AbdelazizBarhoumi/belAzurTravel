import { useEffect, useState, useCallback } from 'react';
import type { AdminState } from '@/types/admin';

/**
 * useAdminStore was previously used as a mock/local-only store that persisted to localStorage.
 * This was insecure as it stored sensitive user data (emails, names) in the browser.
 *
 * We have refactored it to be a simple in-memory ephemeral store for components that
 * haven't been fully migrated to React Query + Backend API yet.
 *
 * IMPORTANT: Most admin pages now use React Query + '@/api/admin.api'.
 * Only use this store for UI-only state or as a temporary bridge.
 */

const initialState: AdminState = {
    destinations: [],
    hotels: [],
    tours: [],
    travels: [],
    bookings: [],
    users: [],
    gallery: [],
};

let listeners: Array<() => void> = [];
let state: AdminState = initialState;

function setState(next: AdminState) {
    state = next;
    listeners.forEach((l) => l());
}

export function useAdminStore() {
    const [, setTick] = useState(0);
    useEffect(() => {
        const l = () => setTick((t) => t + 1);
        listeners.push(l);
        return () => {
            listeners = listeners.filter((x) => x !== l);
        };
    }, []);

    const upsert = useCallback(
        <K extends keyof AdminState>(key: K, item: AdminState[K][number]) => {
            const list: AdminState[K] = state[key];
            const idx = (list as Array<{ id?: string | number }>).findIndex(
                (x) =>
                    (x as { id?: string | number }).id ===
                    (item as { id?: string | number }).id,
            );
            const next: AdminState[K] =
                idx >= 0
                    ? ((list as unknown[]).map((x, i) =>
                          i === idx ? item : x,
                      ) as AdminState[K])
                    : ([...(list as unknown[]), item] as AdminState[K]);
            setState({ ...state, [key]: next } as AdminState);
        },
        [],
    );

    const remove = useCallback(
        <K extends keyof AdminState>(key: K, id: string | number) => {
            const list = state[key] as unknown[];
            const next: AdminState[K] = list.filter(
                (x: unknown) => (x as { id?: string | number }).id !== id,
            ) as AdminState[K];
            setState({ ...state, [key]: next } as AdminState);
        },
        [],
    );

    const reset = useCallback(() => setState(initialState), []);

    return { state, upsert, remove, reset };
}

export function generateId() {
    return Math.random().toString(36).slice(2, 9);
}

// Re-export types for backward compatibility
export type {
    AdminDestination,
    AdminHotel,
    AdminTour,
    AdminTravel,
    AdminBooking,
    AdminUser,
    AdminState,
} from '@/types/admin';
