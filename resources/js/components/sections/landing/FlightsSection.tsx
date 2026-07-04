import { motion } from 'framer-motion';
import { Plane, Clock } from 'lucide-react';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useFlights } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';

interface Props { config: LandingSectionConfig; }

export function FlightsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const { data: flights = [] } = useFlights();
    if (!isPageEnabled('flights', settings.content?.nav?.settings)) return null;

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredFlights');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredFlightsDesc');
    const items = flights.slice(0, 6);
    if (items.length === 0) return null;

    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                </motion.div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((flight, i) => (
                        <motion.div key={flight.code} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Plane className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <span>{flight.from}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span>{localizeText(flight.to, lang)}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{localizeText(flight.airline, lang)}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {localizeText(flight.duration, lang)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-primary">{flight.price} TND</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
