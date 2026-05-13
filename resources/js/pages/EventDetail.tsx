import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { LocalizedText } from '@/api/catalog.api';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data/catalog';
import { useEventBySlug } from '@/hooks/useCatalog';

export default function EventDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const { data: event } = useEventBySlug(slug);

    if (!event) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pb-16 pt-32">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                            {t('events.detail.notFound')}
                        </h1>
                        <Button asChild>
                            <Link to="/events">
                                {t('events.detail.backToEvents')}
                            </Link>
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
                                {
                                    label: localizeText(event.title, lang),
                                    active: true,
                                },
                            ]}
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-10 lg:grid-cols-[2fr_1fr]"
                    >
                        <div className="flex flex-col">
                            <Gallery
                                images={event.gallery}
                                hotelName={localizeText(event.title, lang)}
                            />

                            <div className="mt-8 lg:hidden">
                                <StickyBookingCard
                                    price={event.price}
                                    currency="$"
                                    title={localizeText(event.title, lang)}
                                    details={[
                                        {
                                            label: t('events.detail.when'),
                                            value: localizeText(
                                                event.date,
                                                lang,
                                            ),
                                            icon: Calendar,
                                        },
                                        {
                                            label: t('events.detail.where'),
                                            value: localizeText(
                                                event.location,
                                                lang,
                                            ),
                                            icon: MapPin,
                                        },
                                        {
                                            label: t('events.detail.groupSize'),
                                            value: localizeText(
                                                event.attendees,
                                                lang,
                                            ),
                                            icon: Users,
                                        },
                                    ]}
                                    priceLabel="Package from"
                                    primaryButtonLabel="Reserve a spot"
                                    onBook={() =>
                                        window.open('/contact', '_self')
                                    }
                                />
                            </div>

                            <section className="mt-8 max-w-3xl">
                                <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                    {t('events.detail.aboutTitle')}
                                </h2>
                                <p className="leading-relaxed text-muted-foreground">
                                    {localizeText(event.about, lang)}
                                </p>
                            </section>

                            <section className="mt-8">
                                <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                                    {t('events.detail.scheduleTitle')}
                                </h2>
                                <ol className="relative ml-3 max-w-3xl space-y-5 border-l-2 border-border">
                                    {event.schedule.map(
                                        (
                                            step: {
                                                day: LocalizedText;
                                                activity: LocalizedText;
                                                details: LocalizedText;
                                            },
                                            index: number,
                                        ) => (
                                            <li
                                                key={`${event.slug}-${index}`}
                                                className="ml-6"
                                            >
                                                <div className="absolute -left-[10px] h-5 w-5 rounded-full border-4 border-background bg-primary" />
                                                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                                    {localizeText(
                                                        step.day,
                                                        lang,
                                                    )}
                                                </p>
                                                <p className="font-serif text-lg font-semibold text-foreground">
                                                    {localizeText(
                                                        step.activity,
                                                        lang,
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {localizeText(
                                                        step.details,
                                                        lang,
                                                    )}
                                                </p>
                                            </li>
                                        ),
                                    )}
                                </ol>
                            </section>
                        </div>

                        <aside className="hidden lg:block">
                            <StickyBookingCard
                                price={event.price}
                                currency="$"
                                title={localizeText(event.title, lang)}
                                details={[
                                    {
                                        label: t('events.detail.when'),
                                        value: localizeText(event.date, lang),
                                        icon: Calendar,
                                    },
                                    {
                                        label: t('events.detail.where'),
                                        value: localizeText(
                                            event.location,
                                            lang,
                                        ),
                                        icon: MapPin,
                                    },
                                    {
                                        label: t('events.detail.groupSize'),
                                        value: localizeText(
                                            event.attendees,
                                            lang,
                                        ),
                                        icon: Users,
                                    },
                                ]}
                                priceLabel="Package from"
                                primaryButtonLabel="Reserve a spot"
                                onBook={() => window.open('/contact', '_self')}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
