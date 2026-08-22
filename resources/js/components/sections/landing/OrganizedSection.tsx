import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useTravels } from '@/hooks/usePublicData';

interface Props {
    config: LandingSectionConfig;
}

export function OrganizedSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: travels = [] } = useTravels();

    const title =
        config.title?.[lang] ?? config.title?.en ?? t('home.featuredOrganized');
    const subtitle =
        config.subtitle?.[lang] ??
        config.subtitle?.en ??
        t('home.featuredOrganizedDesc');

    const groupTravels = travels.filter(
        (v) => v.category_assignments?.pricing_type === 'per-group',
    );

    const items = groupTravels.map((travel) => ({
        id: travel.slug,
        title: travel.name[lang] || travel.name.en,
        price: `${travel.price.toLocaleString()} DT`,
        meta: travel.duration[lang] || travel.duration.en,
        image: travel.image,
        href: `/travels/${travel.slug}`,
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
                ctaHref="/travels"
                items={items}
                accent="secondary"
            />
        );
    }

    const displayItems =
        style === 'grid' ? groupTravels.slice(0, 6) : groupTravels.slice(0, 3);

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">
                        {title}
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">
                        {subtitle}
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayItems.map((travel, i) => (
                        <Link
                            key={travel.slug}
                            to={`/travels/${travel.slug}`}
                            className="group"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={travel.image}
                                        alt={localizeText(travel.name, lang)}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">
                                        {travel.price} DT
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />{' '}
                                        {localizeText(travel.location, lang)}
                                    </div>
                                    <h3 className="mt-1 font-serif text-lg font-bold">
                                        {localizeText(travel.name, lang)}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />{' '}
                                            {localizeText(
                                                travel.duration,
                                                lang,
                                            )}
                                        </span>
                                        <span>★ {travel.rating}</span>
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
