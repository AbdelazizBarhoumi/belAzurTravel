export type FavoriteType =
    | 'destination'
    | 'hotel'
    | 'tour'
    | 'travel'
    | 'event'
    | 'car'
    | 'flight';

/**
 * A saved catalogue item. `id` is the item's public key — its slug, or the
 * code for flights — so the same item gets the same favorite on its card and
 * on its detail page, and `favoritePath` can link straight back to it.
 */
export interface FavoriteItem {
    id: string;
    type: FavoriteType;
    name: string;
    image: string;
    price?: number | null;
    location?: string | null;
}

export const FAVORITE_TYPES: FavoriteType[] = [
    'destination',
    'hotel',
    'tour',
    'travel',
    'event',
    'car',
    'flight',
];

const TYPE_PATHS: Record<FavoriteType, string> = {
    destination: '/destinations',
    hotel: '/hotels',
    tour: '/tours',
    travel: '/travels',
    event: '/events',
    car: '/cars',
    flight: '/flights',
};

export function favoriteKey(item: Pick<FavoriteItem, 'type' | 'id'>): string {
    return `${item.type}:${item.id}`;
}

export function favoritePath(item: Pick<FavoriteItem, 'type' | 'id'>): string {
    return `${TYPE_PATHS[item.type]}/${encodeURIComponent(item.id)}`;
}

/** Translation key for the type label ("Circuit", "Hôtel", …). */
export function favoriteTypeLabelKey(type: FavoriteType): string {
    return `favorites.type.${type}`;
}
