import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useDestinations } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';

interface Props {
    config: LandingSectionConfig;
}

export function DestinationsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const { data: destinations = [] } = useDestinations();

    const navSettings = settings.content?.nav?.settings;
    if (!isPageEnabled('destinations', navSettings)) return null;

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredDestinations');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredDestinationsDesc');
    const items = destinations.slice(0, 4);

    if (items.length === 0) return null;

    const style = config.style ?? 'grid';

    if (style === 'carousel') {
        return (
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <SectionHeader title={title} subtitle={subtitle} />
                    <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
                        {items.map((dest, i) => (
                            <Link
                                key={dest.slug}
                                to={`/destinations/${dest.slug}`}
                                className="group shrink-0 w-[300px] snap-start"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="overflow-hidden rounded-2xl border border-border bg-card"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img src={dest.image} alt={localizeText(dest.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {localizeText(dest.country, lang)}
                                        </div>
                                        <h3 className="mt-1 font-serif text-lg font-bold">{localizeText(dest.name, lang)}</h3>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-sm font-bold text-primary">{dest.price} TND</span>
                                            <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-secondary text-secondary" /> {dest.rating}</div>
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

    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <SectionHeader title={title} subtitle={subtitle} />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((dest, i) => (
                        <Link key={dest.slug} to={`/destinations/${dest.slug}`} className="group">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img src={dest.image} alt={localizeText(dest.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute right-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                                        {dest.rating} ★
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" /> {localizeText(dest.country, lang)}
                                    </div>
                                    <h3 className="mt-1 font-serif text-xl font-bold">{localizeText(dest.name, lang)}</h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{localizeText(dest.description, lang)}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="font-bold text-primary">From {dest.price} TND</span>
                                        <span className="text-sm font-semibold text-primary transition-colors group-hover:underline">View →</span>
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
        </motion.div>
    );
}
