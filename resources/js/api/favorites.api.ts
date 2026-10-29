import { apiFetch } from '@/api/http';
import type { FavoriteItem } from '@/lib/favorites';

export async function getFavorites() {
    return apiFetch<FavoriteItem[]>('/api/favorites');
}

export async function addFavorite(item: FavoriteItem) {
    return apiFetch<FavoriteItem[]>('/api/favorites', {
        method: 'POST',
        body: JSON.stringify(item),
    });
}

export async function removeFavorite(item: Pick<FavoriteItem, 'type' | 'id'>) {
    return apiFetch<FavoriteItem[]>(
        `/api/favorites/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}`,
        { method: 'DELETE' },
    );
}

export async function syncFavorites(items: FavoriteItem[]) {
    return apiFetch<FavoriteItem[]>('/api/favorites/sync', {
        method: 'POST',
        body: JSON.stringify({ items }),
    });
}
