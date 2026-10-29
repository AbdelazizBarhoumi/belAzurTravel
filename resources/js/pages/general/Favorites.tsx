import { motion } from 'framer-motion';
import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/hooks/useViewMode';
import { formatPrice, cn } from '@/lib/utils';
import type { FavoriteItem } from '@/contexts/FavoritesContext';

// Favorite ids are only guaranteed to be slugs for hotels; every other type
// sends the visitor to its catalog to pick the item and book from there.
const CATALOG_PATHS: Partial<Record<FavoriteItem['type'], string>> = {
    destination: '/destinations',
    tour: '/tours',
    travel: '/travels',
    car: '/cars',
    flight: '/flights',
    event: '/events',
    deal: '/deals',
    promo: '/deals',
};

function favoriteBookingPath(item: FavoriteItem): string {
    if (item.type === 'hotel') {
        return `/hotels/${encodeURIComponent(item.id)}`;
    }
    return CATALOG_PATHS[item.type] ?? '/';
}

const Favorites = () => {
    const { favorites } = useFavorites();
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useViewMode();

    return (
        <PageShell
            titleKey="favorites.title"
            subtitleKey="favorites.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.favorites'), active: true },
            ]}
        >
            {favorites.length === 0 ? (
                <div className="py-20 text-center">
                    <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                        {t('favorites.empty')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-end">
                        <ViewToggle value={viewMode} onChange={setViewMode} />
                    </div>
                    <div
                        className={cn(
                            'grid gap-6',
                            viewMode === 'grid'
                                ? 'sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid-cols-1',
                        )}
                    >
                    {favorites.map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="card-elevated group relative overflow-hidden rounded-2xl bg-card"
                        >
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={f.image}
                                    alt={f.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <FavoriteButton
                                    item={f}
                                    className="absolute right-3 top-3"
                                />
                            </div>
                            <div className="p-5">
                                <span className="text-xs font-semibold uppercase text-secondary">
                                    {f.type}
                                </span>
                                <h3 className="mt-1 font-serif text-lg font-bold text-foreground">
                                    {f.name}
                                </h3>
                                {f.location && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />{' '}
                                        {f.location}
                                    </p>
                                )}
                                <div className="mt-4 flex items-center justify-between">
                                    {f.type === 'hotel' ? (
                                        <span className="text-xs font-medium text-primary">
                                            {t('hotelDetail.checkAvailability')}
                                        </span>
                                    ) : f.price ? (
                                        <span className="font-bold text-primary">
                                            {formatPrice(f.price, 'TND')}
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    <Button
                                        asChild
                                        size="sm"
                                        className="bg-primary text-xs text-primary-foreground"
                                    >
                                        <Link to={favoriteBookingPath(f)}>
                                            {t('common.book')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    </div>
                </>
            )}
        </PageShell>
    );
};

export default Favorites;
