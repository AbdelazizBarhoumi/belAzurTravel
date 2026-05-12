import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ChevronLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { eventsData, type EventItem, type LocalizedText } from '../data/events.data';

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

export default function EventDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const event = eventsData.find((item: EventItem) => item.slug === slug);

    if (!event) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-32 pb-16">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                            {t('events.detail.notFound')}
                        </h1>
                        <Button asChild>
                            <Link to="/events">{t('events.detail.backToEvents')}</Link>
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.events'), href: '/events' },
                                { label: localize(event.title, lang), active: true },
                            ]}
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-10 lg:grid-cols-[2fr_1fr]"
                    >
                        <div>
                            <Gallery images={event.gallery} hotelName={localize(event.title, lang)} />

                            <section className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                    <div className="text-sm text-muted-foreground">{t('events.detail.when')}</div>
                                    <div className="mt-2 flex items-center gap-2 text-foreground">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        {localize(event.date, lang)}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                    <div className="text-sm text-muted-foreground">{t('events.detail.where')}</div>
                                    <div className="mt-2 flex items-center gap-2 text-foreground">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {localize(event.location, lang)}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                    <div className="text-sm text-muted-foreground">{t('events.detail.groupSize')}</div>
                                    <div className="mt-2 flex items-center gap-2 text-foreground">
                                        <Users className="h-4 w-4 text-primary" />
                                        {localize(event.attendees, lang)}
                                    </div>
                                </div>
                            </section>

                            <section className="max-w-3xl">
                                <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                    {t('events.detail.aboutTitle')}
                                </h2>
                                <p className="leading-relaxed text-muted-foreground">
                                    {localize(event.about, lang)}
                                </p>
                            </section>

                            <section>
                                <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                                    {t('events.detail.scheduleTitle')}
                                </h2>
                                <ol className="relative ml-3 max-w-3xl space-y-5 border-l-2 border-border">
                                    {event.schedule.map((step, index) => (
                                        <li key={`${event.slug}-${index}`} className="ml-6">
                                            <div className="absolute -left-[10px] h-5 w-5 rounded-full border-4 border-background bg-primary" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                                {localize(step.day, lang)}
                                            </p>
                                            <p className="font-serif text-lg font-semibold text-foreground">
                                                {localize(step.activity, lang)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {localize(step.details, lang)}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </div>

                        <aside>
                            <StickyBookingCard
                                price={event.price}
                                currency="$"
                                title={localize(event.title, lang)}
                                location={localize(event.location, lang)}
                                description={localize(event.description, lang)}
                                duration={localize(event.date, lang)}
                                maxGroup={Number.parseInt(localize(event.attendees, lang), 10) || undefined}
                                type={t('nav.events')}
                                rating={4.8}
                                reviews={32}
                                onBook={() => window.open('/contact', '_self')}
                                onWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${localize(event.title, lang)} - ${localize(event.location, lang)}`)}`, '_blank')}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}