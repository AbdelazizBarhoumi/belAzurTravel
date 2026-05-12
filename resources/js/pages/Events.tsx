import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { eventsData, type LocalizedText } from '../data/events.data';

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const Events = () => {
    const { t, lang } = useLanguage();

    return (
        <PageShell
            titleKey="events.title"
            subtitleKey="events.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.events'), active: true },
            ]}
        >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {eventsData.map((e, i) => (
                    <motion.div
                        key={e.slug}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card-elevated group overflow-hidden rounded-2xl bg-card"
                    >
                        <div className="h-56 overflow-hidden">
                            <img
                                src={e.image}
                                alt={localize(e.title, lang)}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-6">
                            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {localize(e.date, lang)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {localize(e.location, lang)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {localize(e.attendees, lang)}
                                </span>
                            </div>
                            <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                {localize(e.title, lang)}
                            </h3>
                            <p className="mb-5 text-sm text-muted-foreground">
                                {localize(e.description, lang)}
                            </p>
                            <Button asChild className="bg-primary text-primary-foreground">
                                <Link to={`/events/${e.slug}`}>{t('common.viewDetails')}</Link>
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Events;
