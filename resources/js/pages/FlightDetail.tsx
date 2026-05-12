import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Clock, Plane } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { flightsData } from '@/data/flights.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;
function localize(value: LocalizedText, lang: Lang): string { return value[lang]; }

export default function FlightDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, lang, dir } = useLanguage();
    const flight = flightsData.find((item) => item.id === id);

    if (!flight) return <Navigate to="/flights" replace />;

    const routeLabel = `${flight.from} → ${localize(flight.to, lang)}`;
    const DirectionIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('flights.title'), href: '/flights' }, { label: routeLabel, active: true }]} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div>
                            <section className="bg-card rounded-3xl p-8 card-elevated mb-8 border border-border">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Plane className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="font-serif text-3xl font-bold text-foreground">{localize(flight.airline, lang)}</h1>
                                        <p className="text-sm text-muted-foreground">{localize(flight.stops, lang)} · {flight.aircraft}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4 py-6 border-y border-border">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-foreground">{flight.departure}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{flight.from}</p>
                                    </div>
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <Clock className="h-4 w-4 mb-1" />
                                        <span className="text-sm font-medium">{flight.duration}</span>
                                        <DirectionIcon className="h-4 w-4 mt-1" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-foreground">{flight.arrival}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{localize(flight.to, lang)}</p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
                                    <div className="p-4 rounded-xl bg-muted/40">
                                        <p className="text-xs text-muted-foreground mb-1">{t('label.cabin')}</p>
                                        <p className="font-bold text-foreground">{flight.cabin}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/40">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Briefcase className="h-3 w-3" /> {t('label.baggage')}</p>
                                        <p className="font-bold text-foreground">{flight.baggage}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/40">
                                        <p className="text-xs text-muted-foreground mb-1">{t('label.aircraft')}</p>
                                        <p className="font-bold text-foreground">{flight.aircraft}</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="lg:pt-6">
                            <StickyBookingCard
                                price={flight.price}
                                currency="$"
                                title={routeLabel}
                                duration={`${flight.duration} • ${localize(flight.stops, lang)}`}
                                type={flight.cabin}
                                rating={4.8}
                                reviews={128}
                                onBook={() => window.alert('Proceed to flight booking flow')}
                                onWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Flight booking request: ${routeLabel}`)}`, '_blank')}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
