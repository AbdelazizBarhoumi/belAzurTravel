import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { ThemeIcons } from '@/components/cards/ThemeIcons';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useHotels, useCategoryTypesPublic } from '@/hooks/usePublicData';
import { getHotelCategoryLabels } from '@/lib/categoryLabels';

interface Props { config: LandingSectionConfig; }

export function HotelsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: hotels = [] } = useHotels();
    const { data: categoryTypes = [] } = useCategoryTypesPublic('hotels');

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredHotels');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredHotelsDesc');
    if (hotels.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        const items = hotels.slice(0, 6).map((hotel) => ({
            id: hotel.slug,
            title: localizeText(hotel.name, lang),
            price: hotel.price !== null ? `${hotel.price} TND${t('hotelDetail.pernight')}` : '',
            meta: localizeText(hotel.location, lang),
            image: hotel.image,
            href: `/hotels/${hotel.slug}`,
            amenities: hotel.amenities,
            tags: hotel.tags,
        }));
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/hotels"
                items={items}
                accent="primary"
            />
        );
    }

    if (style === 'cards') {
        const items = hotels.slice(0, 3);
        return (
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <Header title={title} subtitle={subtitle} />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((hotel, i) => (
                            <Link key={hotel.slug} to={`/hotels/${hotel.slug}`} className="group">
                                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="relative h-48 overflow-hidden">
                                        <img src={hotel.image} alt={localizeText(hotel.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">{hotel.price !== null ? `${hotel.price} TND${t('hotelDetail.pernight')}` : t('hotelDetail.noPrice')}</div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {localizeText(hotel.location, lang)}</div>
                                        <h3 className="mt-1 font-serif text-lg font-bold">{localizeText(hotel.name, lang)}</h3>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex text-secondary">{'★'.repeat(hotel.stars)}</div>
                                            <span className="text-xs font-semibold">{hotel.rating}</span>
                                        </div>
                                        {(() => {
                                            const catLabels = getHotelCategoryLabels(hotel.category_assignments, categoryTypes, lang, 3);
                                            if (catLabels.length === 0) return null;
                                            return (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {catLabels.map((label) => (
                                                        <span key={label} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                        {(hotel.tags?.length || hotel.amenities?.length) && (
                                            <div className="mt-2.5">
                                                <ThemeIcons tags={hotel.tags} amenities={hotel.amenities} maxVisible={6} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // grid — 6 items, 2 rows of 3
    const items = hotels.slice(0, 6);
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <Header title={title} subtitle={subtitle} />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((hotel, i) => (
                        <Link key={hotel.slug} to={`/hotels/${hotel.slug}`} className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="relative h-56 overflow-hidden">
                                    <img src={hotel.image} alt={localizeText(hotel.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">{hotel.price !== null ? `${hotel.price} TND${t('hotelDetail.pernight')}` : t('hotelDetail.noPrice')}</div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {localizeText(hotel.location, lang)}</div>
                                    <h3 className="mt-1 font-serif text-xl font-bold">{localizeText(hotel.name, lang)}</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex text-secondary">{'★'.repeat(hotel.stars)}</div>
                                        <span className="text-sm font-semibold text-secondary">{hotel.rating}</span>
                                    </div>
                                    {(() => {
                                        const catLabels = getHotelCategoryLabels(hotel.category_assignments, categoryTypes, lang, 3);
                                        if (catLabels.length === 0) return null;
                                        return (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {catLabels.map((label) => (
                                                    <span key={label} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                    {(hotel.tags?.length || hotel.amenities?.length) && (
                                        <div className="mt-2.5">
                                            <ThemeIcons tags={hotel.tags} amenities={hotel.amenities} maxVisible={6} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
        </motion.div>
    );
}
