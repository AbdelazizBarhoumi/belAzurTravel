import { motion } from 'framer-motion';
import { ShieldCheck, MapPin } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { carsData } from '@/data/cars.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;
function localize(value: LocalizedText, lang: Lang): string { return value[lang]; }

export default function CarDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const car = carsData.find((item) => item.slug === slug);

    if (!car) return <Navigate to="/cars" replace />;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8"><Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('cars.title'), href: '/cars' }, { label: localize(car.name, lang), active: true }]} /></div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                                <img src={car.image} alt={localize(car.name, lang)} className="h-[420px] w-full object-cover md:h-[520px]" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Category</div><div className="mt-2 font-semibold">{localize(car.category, lang)}</div></div>
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Seats</div><div className="mt-2 font-semibold">{car.seats}</div></div>
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Fuel</div><div className="mt-2 font-semibold">{localize(car.fuel, lang)}</div></div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-4 font-serif text-xl font-bold">Features & policy</h3>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <ul className="space-y-2 text-sm text-foreground">
                                        {car.features.map((feature) => <li key={feature} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-secondary" /> {feature}</li>)}
                                    </ul>
                                    <ul className="space-y-2 text-sm text-foreground">
                                        {car.policy.map((item) => <li key={item} className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> {item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <aside className="lg:pt-6">
                            <StickyBookingCard
                                price={car.price}
                                currency="$"
                                type={localize(car.transmission, lang)}
                                rating={4.9}
                                reviews={62}
                                onBook={() => window.alert('Proceed to car booking flow')}
                                onWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Car rental request: ${localize(car.name, lang)}`)}`, '_blank')}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
