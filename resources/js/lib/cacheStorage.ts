/**
 * Simple localStorage-based cache storage for React Query.
 * Persists query cache across page reloads so categories, site settings,
 * and other stable data don't refetch on every browser refresh.
 */

const CACHE_VERSION = 'v1';

// Minimal CacheStorage interface compatible with React Query's persisted cache
type CacheStorage = {
    getItem: (key: string) => Promise<unknown | null> | unknown | null;
    setItem: (key: string, value: unknown) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
};

const CACHE_KEY = `rq_cache:${CACHE_VERSION}`;

export const localStorageCacheStorage: CacheStorage = {
    getItem: async (key: string) => {
        try {
            const item = localStorage.getItem(`${CACHE_KEY}:${key}`);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: unknown) => {
        try {
            localStorage.setItem(`${CACHE_KEY}:${key}`, JSON.stringify(value));
        } catch {
            // Silently ignore quota exceeded or other storage errors
        }
    },
    removeItem: async (key: string) => {
        try {
            localStorage.removeItem(`${CACHE_KEY}:${key}`);
        } catch {
            // Silently ignore errors
        }
    },
};

/**
 * Clear all persisted React Query cache from localStorage.
 * Useful for logout or manual cache reset.
 */
export function clearQueryCache(): void {
    try {
        const keysToRemove = Object.keys(localStorage).filter((key) =>
            key.startsWith(CACHE_KEY),
        );
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
        // Silently ignore errors
    }
}
