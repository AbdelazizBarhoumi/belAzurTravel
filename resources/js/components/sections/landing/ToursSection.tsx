import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useTours } from '@/hooks/usePublicData';

interface Props { config: LandingSectionConfig; }

export function ToursSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: tours = [] } = useTours();

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredTours');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredToursDesc');

    const items = tours.map((tour) => ({
        id: tour.slug,
        title: tour.name[lang] || tour.name.en,
        price: `${tour.price.toLocaleString()} DT`,
        meta: tour.duration[lang] || tour.duration.en,
        image: tour.image,
        href: `/tours/${tour.slug}`,
    }));

    if (items.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/tours"
                items={items}
                accent="primary"
            />
        );
    }

    const displayItems = style === 'grid' ? tours.slice(0, 6) : tours.slice(0, 3);

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayItems.map((tour, i) => (
                        <Link key={tour.slug} to={`/tours/${tour.slug}`} className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="relative h-48 overflow-hidden">
                                    <img src={tour.image} alt={localizeText(tour.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">{tour.price} DT</div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" /> {localizeText(tour.location, lang)}
                                    </div>
                                    <h3 className="mt-1 font-serif text-lg font-bold">{localizeText(tour.name, lang)}</h3>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {localizeText(tour.duration, lang)}</span>
                                        <span>★ {tour.rating}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
