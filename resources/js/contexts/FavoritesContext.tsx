import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FavoriteItem {
    id: string;
    type:
        | 'destination'
        | 'hotel'
        | 'tour'
        | 'car'
        | 'flight'
        | 'event'
        | 'deal'
        | 'promo'
        | 'blog'
        | 'travel';
    name: string;
    image: string;
    price?: number;
    location?: string;
}

interface FavoritesContextValue {
    favorites: FavoriteItem[];
    isFavorite: (id: string) => boolean;
    toggle: (item: FavoriteItem) => void;
    remove: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
    undefined,
);

const STORAGE_KEY = 'voyageur_favorites';

function parseFavorites(raw: string | null): FavoriteItem[] {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (item): item is FavoriteItem =>
                item &&
                typeof item.id === 'string' &&
                typeof item.type === 'string' &&
                typeof item.name === 'string' &&
                typeof item.image === 'string' &&
                !item.image.startsWith('http://') &&
                !item.image.startsWith('https://'),
        );
    } catch {
        return [];
    }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
        return parseFavorites(localStorage.getItem(STORAGE_KEY));
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY) {
                setFavorites(parseFavorites(event.newValue));
            }
        };

        window.addEventListener('storage', handleStorage);

        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const isFavorite = (id: string) =>
        favorites.some((favorite) => favorite.id === id);
    const { t } = useLanguage();

    const toggle = (item: FavoriteItem) => {
        setFavorites((prev) => {
            const safeItem = {
                ...item,
                image:
                    item.image &&
                    !item.image.startsWith('http://') &&
                    !item.image.startsWith('https://')
                        ? item.image
                        : '/images/hero-travel.jpg',
            };

            if (prev.some((f) => f.id === item.id)) {
                toast.success(t('common.removedFav'));
                return prev.filter((f) => f.id !== item.id);
            }
            toast.success(t('common.addedFav'));
            return [...prev, safeItem];
        });
    };

    const remove = (id: string) => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        toast.success(t('common.removedFav'));
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
