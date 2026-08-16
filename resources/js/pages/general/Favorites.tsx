import { motion } from 'framer-motion';
import { Heart, MapPin } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Favorites = () => {
    const { favorites } = useFavorites();
    const { t } = useLanguage();

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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                                            ${f.price.toLocaleString()}
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    <Button
                                        size="sm"
                                        className="bg-primary text-xs text-primary-foreground"
                                    >
                                        {t('common.book')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </PageShell>
    );
};

export default Favorites;
