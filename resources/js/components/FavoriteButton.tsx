import { Heart } from 'lucide-react';
import type { FavoriteItem } from '@/contexts/FavoritesContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { cn } from '@/lib/utils';

interface Props {
    item: FavoriteItem;
    className?: string;
}

export function FavoriteButton({ item, className }: Props) {
    const { isFavorite, toggle } = useFavorites();
    const active = isFavorite(item.id);

    return (
        <button
            type="button"
            aria-label="Toggle favorite"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(item);
            }}
            className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur transition-all hover:scale-110',
                className,
            )}
        >
            <Heart
                className={cn(
                    'h-4 w-4 transition-colors',
                    active
                        ? 'fill-destructive text-destructive'
                        : 'text-muted-foreground',
                )}
            />
        </button>
    );
}
