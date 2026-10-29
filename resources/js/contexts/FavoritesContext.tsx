import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { toast } from 'sonner';
import {
    addFavorite,
    getFavorites,
    removeFavorite,
    syncFavorites,
} from '@/api/favorites.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import type { FavoriteItem } from '@/lib/favorites';
import { FAVORITE_TYPES, favoriteKey } from '@/lib/favorites';

export type { FavoriteItem, FavoriteType } from '@/lib/favorites';

interface FavoritesContextValue {
    favorites: FavoriteItem[];
    isFavorite: (item: Pick<FavoriteItem, 'type' | 'id'>) => boolean;
    toggle: (item: FavoriteItem) => void;
    remove: (item: Pick<FavoriteItem, 'type' | 'id'>) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
    undefined,
);

// Guests keep favorites in the browser until they sign in; they are then
// merged into the account and this list is cleared.
const GUEST_KEY = 'voyageur_favorites_v2';
// Pre-account format: ids were `tour-<slug>`, `dest-<slug>`, … or names.
const LEGACY_KEY = 'voyageur_favorites';
const FAVORITES_QUERY_KEY = ['favorites'] as const;

function isFavoriteItem(value: unknown): value is FavoriteItem {
    const item = value as FavoriteItem | null;
    return (
        !!item &&
        typeof item.id === 'string' &&
        item.id !== '' &&
        FAVORITE_TYPES.includes(item.type) &&
        typeof item.name === 'string'
    );
}

function readStorage(key: string): unknown[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeGuestFavorites(items: FavoriteItem[]): void {
    try {
        if (items.length === 0) {
            localStorage.removeItem(GUEST_KEY);
        } else {
            localStorage.setItem(GUEST_KEY, JSON.stringify(items));
        }
    } catch {
        // Storage blocked: favorites just won't persist for this guest.
    }
}

/** Recovers legacy entries whose id still carries a slug; drops the rest. */
function migrateLegacy(): FavoriteItem[] {
    const legacy = readStorage(LEGACY_KEY);
    try {
        localStorage.removeItem(LEGACY_KEY);
    } catch {
        // ignore
    }

    const prefixes: Record<string, FavoriteItem['type']> = {
        'hotel-': 'hotel',
        'tour-': 'tour',
        'travel-': 'travel',
        'dest-': 'destination',
    };

    return legacy.flatMap((raw) => {
        const entry = raw as Partial<FavoriteItem> & { id?: string };
        if (!entry || typeof entry.id !== 'string' || !entry.name) return [];

        let id = entry.id;
        let type = entry.type as FavoriteItem['type'];
        for (const [prefix, prefixType] of Object.entries(prefixes)) {
            if (id.startsWith(prefix)) {
                id = id.slice(prefix.length);
                type = prefixType;
                break;
            }
        }
        // Name-based ids (spaces, capitals) cannot be linked back to an item.
        if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return [];

        const item = { ...entry, id, type } as FavoriteItem;
        return isFavoriteItem(item) ? [item] : [];
    });
}

function loadGuestFavorites(): FavoriteItem[] {
    const current = readStorage(GUEST_KEY).filter(isFavoriteItem);
    const migrated = migrateLegacy();
    if (migrated.length === 0) return current;

    const merged = [...current];
    for (const item of migrated) {
        if (!merged.some((f) => favoriteKey(f) === favoriteKey(item))) {
            merged.push(item);
        }
    }
    writeGuestFavorites(merged);
    return merged;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { data: user } = useAuthUser();
    const isSignedIn = Boolean(user);

    const [guestFavorites, setGuestFavorites] = useState<FavoriteItem[]>(
        () => (typeof window === 'undefined' ? [] : loadGuestFavorites()),
    );

    const { data: accountFavorites = [] } = useQuery({
        queryKey: FAVORITES_QUERY_KEY,
        queryFn: getFavorites,
        enabled: isSignedIn,
        staleTime: 5 * 60 * 1000,
    });

    // On sign-in, hand the guest list to the account once, then forget it.
    const syncedForUser = useRef<number | string | null>(null);
    useEffect(() => {
        if (!user) {
            syncedForUser.current = null;
            queryClient.removeQueries({ queryKey: FAVORITES_QUERY_KEY });
            return;
        }
        if (syncedForUser.current === user.id) return;
        syncedForUser.current = user.id;

        const pending = readStorage(GUEST_KEY).filter(isFavoriteItem);
        if (pending.length === 0) return;

        syncFavorites(pending)
            .then((list) => {
                queryClient.setQueryData(FAVORITES_QUERY_KEY, list);
                writeGuestFavorites([]);
                setGuestFavorites([]);
            })
            .catch(() => {
                // Keep the guest list; the next sign-in retries the merge.
            });
    }, [user, queryClient]);

    // Other tabs editing the guest list.
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === GUEST_KEY) {
                setGuestFavorites(readStorage(GUEST_KEY).filter(isFavoriteItem));
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const favorites = isSignedIn ? accountFavorites : guestFavorites;

    const keys = useMemo(
        () => new Set(favorites.map((f) => favoriteKey(f))),
        [favorites],
    );
    const isFavorite = useCallback(
        (item: Pick<FavoriteItem, 'type' | 'id'>) => keys.has(favoriteKey(item)),
        [keys],
    );

    const accountMutation = useMutation({
        mutationFn: ({ item, add }: { item: FavoriteItem; add: boolean }) =>
            add ? addFavorite(item) : removeFavorite(item),
        onMutate: async ({ item, add }) => {
            await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
            const previous =
                queryClient.getQueryData<FavoriteItem[]>(FAVORITES_QUERY_KEY) ??
                [];
            const without = previous.filter(
                (f) => favoriteKey(f) !== favoriteKey(item),
            );
            queryClient.setQueryData(
                FAVORITES_QUERY_KEY,
                add ? [item, ...without] : without,
            );
            return { previous };
        },
        onSuccess: (list) => {
            queryClient.setQueryData(FAVORITES_QUERY_KEY, list);
        },
        onError: (error: Error, _vars, context) => {
            if (context) {
                queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
            }
            toast.error(error.message || t('common.error'));
        },
    });

    const setFavorite = (item: FavoriteItem, add: boolean) => {
        toast.success(add ? t('common.addedFav') : t('common.removedFav'));

        if (isSignedIn) {
            accountMutation.mutate({ item, add });
            return;
        }

        const without = guestFavorites.filter(
            (f) => favoriteKey(f) !== favoriteKey(item),
        );
        const next = add ? [item, ...without] : without;
        setGuestFavorites(next);
        writeGuestFavorites(next);
    };

    const toggle = (item: FavoriteItem) => setFavorite(item, !isFavorite(item));

    const remove = (item: Pick<FavoriteItem, 'type' | 'id'>) => {
        const existing = favorites.find(
            (f) => favoriteKey(f) === favoriteKey(item),
        );
        if (existing) setFavorite(existing, false);
    };

    return (
        <FavoritesContext.Provider
            value={{ favorites, isFavorite, toggle, remove }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const ctx = useContext(FavoritesContext);
    if (!ctx)
        throw new Error('useFavorites must be used within FavoritesProvider');
    return ctx;
}
