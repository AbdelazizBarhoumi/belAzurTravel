import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useHotels } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';

interface Props { config: LandingSectionConfig; }

export function HotelsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const { data: hotels = [] } = useHotels();
    if (!isPageEnabled('hotels', settings.content?.nav?.settings)) return null;

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredHotels');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredHotelsDesc');
    const items = hotels.slice(0, 6);
    if (items.length === 0) return null;

    const style = config.style ?? 'cards';

    if (style === 'carousel') {
        return (
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <Header title={title} subtitle={subtitle} />
                    <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
                        {items.map((hotel, i) => (
                            <Link key={hotel.slug} to={`/hotels/${hotel.slug}`} className="group shrink-0 w-[320px] snap-start">
                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="overflow-hidden rounded-2xl border border-border bg-card">
                                    <div className="relative h-48 overflow-hidden">
                                        <img src={hotel.image} alt={localizeText(hotel.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">{hotel.price} TND</div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {localizeText(hotel.location, lang)}</div>
                                        <h3 className="mt-1 font-serif text-lg font-bold">{localizeText(hotel.name, lang)}</h3>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex text-secondary">{'★'.repeat(hotel.stars)}</div>
                                            <span className="text-xs font-semibold">{hotel.rating}</span>
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
        <section className="py-16">
            <div className="container mx-auto px-4">
                <Header title={title} subtitle={subtitle} />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((hotel, i) => (
                        <Link key={hotel.slug} to={`/hotels/${hotel.slug}`} className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="relative h-56 overflow-hidden">
                                    <img src={hotel.image} alt={localizeText(hotel.name, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute right-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">{hotel.price} TND</div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {localizeText(hotel.location, lang)}</div>
                                    <h3 className="mt-1 font-serif text-xl font-bold">{localizeText(hotel.name, lang)}</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex text-secondary">{'★'.repeat(hotel.stars)}</div>
                                        <span className="text-sm font-semibold text-secondary">{hotel.rating}</span>
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

function Header({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
        </motion.div>
    );
}
