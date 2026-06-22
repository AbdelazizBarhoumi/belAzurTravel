import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { LocalizedText } from '@/api/entities.api';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { PageShell } from '@/components/layout/PageShell';
import { Gallery } from '@/components/media/Gallery';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useEventBySlug } from '@/hooks/usePublicData';

export default function EventDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const { data: event, isLoading } = useEventBySlug(slug);
    const aboutText = event
        ? localizeText(event.description ?? event.about, lang)
        : '';

    if (isLoading) {
        return null;
    }

    if (!event) {
        return (
            <PageShell>
                <div className="py-12 text-center">
                    <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                        {t('events.detail.notFound')}
                    </h1>
                    <Button asChild>
                        <Link to="/events">
                            {t('events.detail.backToEvents')}
                        </Link>
                    </Button>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.events'), href: '/events' },
                { label: localizeText(event.title, lang), active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="flex flex-col">
                    <Gallery
                        images={
                            event.image
                                ? [event.image, ...(event.gallery ?? [])]
                                : (event.gallery ?? [])
                        }
                        hotelName={localizeText(event.title, lang)}
                    />

                    <div className="mt-8 lg:hidden">
                        <StickyBookingCard
                            price={event.price}
                            currency="TND"
                            title={localizeText(event.title, lang)}
                            details={[
                                {
                                    label: t('events.detail.when'),
                                    value: localizeText(event.date, lang),
                                    icon: Calendar,
                                },
                                {
                                    label: t('events.detail.where'),
                                    value: localizeText(event.location, lang),
                                    icon: MapPin,
                                },
                                {
                                    label: t('events.detail.groupSize'),
                                    value: localizeText(event.attendees, lang),
                                    icon: Users,
                                },
                            ]}
                            priceLabel="Package from"
                            primaryButtonLabel="Reserve a spot"
                            onBook={() => window.open('/contact', '_self')}
                        />
                    </div>

                    {aboutText && (
                        <section className="mt-8 max-w-3xl">
                            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                {t('events.detail.aboutTitle')}
                            </h2>
                            <p className="leading-relaxed text-muted-foreground">
                                {aboutText}
                            </p>
                        </section>
                    )}

                    {event.schedule && event.schedule.length > 0 && (
                        <section className="mt-8">
                            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                                {t('events.detail.scheduleTitle')}
                            </h2>
                            <ol
                                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                className={`relative max-w-3xl border-border ${
                                    lang === 'ar'
                                        ? 'border-r-2 pr-6'
                                        : 'border-l-2 pl-6'
                                }`}
                            >
                                {(event.schedule ?? []).map(
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
                                            className={`relative pb-8 ${
                                                lang === 'ar'
                                                    ? 'text-right'
                                                    : 'text-left'
                                            }`}
                                        >
                                            <div
                                                className={`absolute top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md ${
                                                    lang === 'ar'
                                                        ? '-right-[42px]'
                                                        : '-left-[42px]'
                                                }`}
                                            >
                                                {index + 1}
                                            </div>

                                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                                {localizeText(step.day, lang)}
                                            </p>

                                            <p className="font-serif text-lg font-semibold text-foreground">
                                                {localizeText(step.activity, lang)}
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                {localizeText(step.details, lang)}
                                            </p>
                                        </li>
                                    ),
                                )}
                            </ol>
                        </section>
                    )}
                </div>

                <aside className="hidden lg:block">
                    <StickyBookingCard
                        price={event.price}
                        currency="TND"
                        title={localizeText(event.title, lang)}
                        entityType="tour"
                        itemSlug={event.slug}
                        details={[
                            {
                                label: t('events.detail.when'),
                                value: localizeText(event.date, lang),
                                icon: Calendar,
                            },
                            {
                                label: t('events.detail.where'),
                                value: localizeText(event.location, lang),
                                icon: MapPin,
                            },
                            {
                                label: t('events.detail.groupSize'),
                                value: localizeText(event.attendees, lang),
                                icon: Users,
                            },
                        ]}
                        priceLabel="Package from"
                        primaryButtonLabel="Reserve a spot"
                    />
                </aside>
            </motion.div>
        </PageShell>
    );
}
