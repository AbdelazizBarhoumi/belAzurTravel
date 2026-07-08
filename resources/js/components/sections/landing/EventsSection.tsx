import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useEvents } from '@/hooks/usePublicData';

interface Props { config: LandingSectionConfig; }

export function EventsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: events = [] } = useEvents();

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredEvents');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredEventsDesc');
    if (events.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        const items = events.slice(0, 6).map((event) => ({
            id: event.slug,
            title: localizeText(event.title, lang),
            price: localizeText(event.category_key, lang),
            meta: `${localizeText(event.date, lang)} · ${localizeText(event.location, lang)}`,
            image: event.image || '',
            href: `/events/${event.slug}`,
        }));
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/events"
                items={items}
                accent="primary"
            />
        );
    }

    if (style === 'cards') {
        const items = events.slice(0, 3);
        return (
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                        <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                        <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                    </motion.div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((event, i) => (
                            <Link key={event.slug} to={`/events/${event.slug}`} className="group">
                                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="relative h-48 overflow-hidden bg-muted">
                                        {event.image && <img src={event.image} alt={localizeText(event.title, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                                        <div className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{event.category_key ? localizeText(event.category_key, lang) : ''}</div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {localizeText(event.date, lang)}</div>
                                        <h3 className="mt-1 font-serif text-lg font-bold line-clamp-1">{localizeText(event.title, lang)}</h3>
                                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {localizeText(event.location, lang)}</div>
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
    const items = events.slice(0, 6);
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((event, i) => (
                        <Link key={event.slug} to={`/events/${event.slug}`} className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="relative h-48 overflow-hidden bg-muted">
                                    {event.image && <img src={event.image} alt={localizeText(event.title, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                                    <div className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{event.category_key ? localizeText(event.category_key, lang) : ''}</div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {localizeText(event.date, lang)}</div>
                                    <h3 className="mt-1 font-serif text-lg font-bold line-clamp-1">{localizeText(event.title, lang)}</h3>
                                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {localizeText(event.location, lang)}</div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
