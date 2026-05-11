import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FavoriteItem {
    id: string;
    type: 'destination' | 'hotel' | 'tour';
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

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const isFavorite = (id: string) => favorites.some((f) => f.id === id);
    const { t } = useLanguage();

    const toggle = (item: FavoriteItem) => {
        setFavorites((prev) => {
            if (prev.some((f) => f.id === item.id)) {
                toast.success(t('common.removedFav'));
                return prev.filter((f) => f.id !== item.id);
            }
            toast.success(t('common.addedFav'));
            return [...prev, item];
        });
    };

    const remove = (id: string) => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
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
