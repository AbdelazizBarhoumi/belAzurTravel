import { motion } from 'framer-motion';
import { Clock, Plane, MapPin, Briefcase, ShieldCheck, Ticket } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { flightsData } from '@/data/flights.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;
function localize(value: LocalizedText, lang: Lang): string { return value[lang]; }

export default function FlightDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, lang } = useLanguage();
    const flight = flightsData.find((item) => item.id === id);

    if (!flight) return <Navigate to="/flights" replace />;

    const routeLabel = `${flight.from} → ${localize(flight.to, lang)}`;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('flights.title'), href: '/flights' }, { label: routeLabel, active: true }]} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-10">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                        <Plane className="h-3.5 w-3.5" /> {localize(flight.airline, lang)}
                                    </div>
                                    <h1 className="mb-3 font-serif text-4xl font-bold text-foreground">{routeLabel}</h1>
                                    <p className="max-w-2xl text-muted-foreground">{localize(flight.stops, lang)} • {flight.duration} • {flight.cabin}</p>
                                </div>
                            </section>

                            <section className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Departure</div><div className="mt-2 font-semibold">{flight.departure}</div></div>
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Arrival</div><div className="mt-2 font-semibold">{flight.arrival}</div></div>
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Duration</div><div className="mt-2 font-semibold">{flight.duration}</div></div>
                            </section>

                            <section className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-card p-6">
                                    <h3 className="mb-4 font-serif text-xl font-bold">Trip details</h3>
                                    <ul className="space-y-3 text-sm text-foreground">
                                        <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> {flight.from} → {localize(flight.to, lang)}</li>
                                        <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-secondary" /> {flight.duration}</li>
                                        <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-secondary" /> {flight.baggage}</li>
                                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-secondary" /> {flight.refund}</li>
                                    </ul>
                                </div>

                                <div className="rounded-2xl border border-border bg-card p-6">
                                    <h3 className="mb-4 font-serif text-xl font-bold">What’s included</h3>
                                    <ul className="space-y-3 text-sm text-foreground">
                                        <li className="flex items-center gap-2"><Ticket className="h-4 w-4 text-secondary" /> Fare guaranteed after selection</li>
                                        <li className="flex items-center gap-2"><Ticket className="h-4 w-4 text-secondary" /> Secure payment flow</li>
                                        <li className="flex items-center gap-2"><Ticket className="h-4 w-4 text-secondary" /> Instant booking confirmation</li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        <aside className="lg:pt-6">
                            <StickyBookingCard
                                price={flight.price}
                                currency="$"
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
