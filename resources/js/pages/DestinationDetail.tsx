import { motion } from 'framer-motion';
import { Calendar, Check, Cloud, DollarSign, Globe } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { PageShell } from '@/components/layout/PageShell';
import { Gallery } from '@/components/media/Gallery';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDestinationBySlug, useHotels, useTours } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}
export default function DestinationDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const { data: destination, isLoading } = useDestinationBySlug(slug);
    const { data: hotels = [] } = useHotels();
    const { data: tours = [] } = useTours();

    if (isLoading) {
        return null;
    }

    if (!destination) {
        return (
            <PageShell>
                <div className="py-12 text-center">
                    <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                        {t('destinationDetail.notFound')}
                    </h1>
                    <Button asChild>
                        <Link to="/destinations">
                            {t('destinationDetail.backToDestinations')}
                        </Link>
                    </Button>
                </div>
            </PageShell>
        );
    }

    const relatedHotels = hotels.filter(
        (hotel) => hotel.destinationSlug === destination.slug,
    );
    const relatedTours = tours;

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.destinations'), href: '/destinations' },
                { label: localize(destination.name, lang), active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 grid gap-8 lg:grid-cols-[2fr_1fr]"
            >
                <div className="flex flex-col">
                    <Gallery
                        images={destination.gallery ?? []}
                        hotelName={localize(destination.name, lang)}
                    />

                    <div className="mt-8 lg:hidden">
                        <StickyBookingCard
                            price={destination.price}
                            currency="$"
                            title={localize(destination.name, lang)}
                            location={localize(destination.country, lang)}
                            description={localize(
                                destination.description,
                                lang,
                            )}
                            details={[
                                ...(destination.bestTime
                                    ? [
                                          {
                                              label: t(
                                                  'destinationDetail.bestTime',
                                              ),
                                              value: localize(
                                                  destination.bestTime!,
                                                  lang,
                                              ),
                                              icon: Calendar,
                                          },
                                      ]
                                    : []),
                                ...(destination.language
                                    ? [
                                          {
                                              label: t(
                                                  'destinationDetail.language',
                                              ),
                                              value: localize(
                                                  destination.language!,
                                                  lang,
                                              ),
                                              icon: Globe,
                                          },
                                      ]
                                    : []),
                                ...(destination.currency
                                    ? [
                                          {
                                              label: t(
                                                  'destinationDetail.currency',
                                              ),
                                              value: localize(
                                                  destination.currency!,
                                                  lang,
                                              ),
                                              icon: DollarSign,
                                          },
                                      ]
                                    : []),
                                ...(destination.weather
                                    ? [
                                          {
                                              label: t(
                                                  'destinationDetail.weather',
                                              ),
                                              value: localize(
                                                  destination.weather!,
                                                  lang,
                                              ),
                                              icon: Cloud,
                                          },
                                      ]
                                    : []),
                            ]}
                            badge={localize(destination.category!, lang)}
                            priceLabel={t('destinationDetail.startingFrom')}
                            rating={destination.rating}
                            favoriteItem={{
                                id: `dest-${destination.slug}`,
                                type: 'destination',
                                name: localize(destination.name, lang),
                                image: destination.image,
                                price: destination.price,
                                location: localize(destination.country, lang),
                            }}
                            primaryButtonLabel={t('destinationDetail.planTrip')}
                            onBook={() =>
                                window.open(
                                    `/design-trip?destination=${destination.slug}`,
                                    '_self',
                                )
                            }
                        />
                    </div>

                    {destination.about && (
                        <section className="mt-8 max-w-3xl">
                            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                {t('destinationDetail.about')}{' '}
                                {localize(destination.name, lang)}
                            </h2>
                            <p className="leading-relaxed text-muted-foreground">
                                {localize(destination.about, lang)}
                            </p>
                        </section>
                    )}

                    {destination.highlights &&
                        destination.highlights.length > 0 && (
                            <section className="mb-12 mt-8">
                                <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                    {t('destinationDetail.highlights')}
                                </h2>
                                <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
                                    {destination.highlights.map((highlight) => (
                                        <div
                                            key={highlight.en}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <Check className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-sm text-foreground">
                                                {localize(highlight, lang)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                </div>

                <aside className="hidden lg:block">
                    <StickyBookingCard
                        price={destination.price}
                        currency="$"
                        title={localize(destination.name, lang)}
                        location={localize(destination.country, lang)}
                        description={localize(destination.description!, lang)}
                        details={[
                            {
                                label: t('destinationDetail.bestTime'),
                                value: localize(destination.bestTime!, lang),
                                icon: Calendar,
                            },
                            {
                                label: t('destinationDetail.language'),
                                value: localize(destination.language!, lang),
                                icon: Globe,
                            },
                            {
                                label: t('destinationDetail.currency'),
                                value: localize(destination.currency!, lang),
                                icon: DollarSign,
                            },
                            {
                                label: t('destinationDetail.weather'),
                                value: localize(destination.weather!, lang),
                                icon: Cloud,
                            },
                        ]}
                        badge={localize(destination.category!, lang)}
                        priceLabel={t('destinationDetail.startingFrom')}
                        rating={destination.rating}
                        favoriteItem={{
                            id: `dest-${destination.slug}`,
                            type: 'destination',
                            name: localize(destination.name, lang),
                            image: destination.image,
                            price: destination.price,
                            location: localize(destination.country, lang),
                        }}
                        primaryButtonLabel={t('destinationDetail.planTrip')}
                        onBook={() =>
                            window.open(
                                `/design-trip?destination=${destination.slug}`,
                                '_self',
                            )
                        }
                    />
                </aside>
            </motion.div>

            {relatedHotels.length > 0 && (
                <section className="mb-12">
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('destinationDetail.whereToStay')}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedHotels.map((hotel) => (
                            <Link
                                key={hotel.slug}
                                to={`/hotels/${hotel.slug}`}
                                className="card-elevated group overflow-hidden rounded-2xl bg-card"
                            >
                                <div className="h-40 overflow-hidden">
                                    <img
                                        src={hotel.image}
                                        alt={localize(hotel.name, lang)}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-serif font-bold text-foreground">
                                        {localize(hotel.name, lang)}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {t('destinationDetail.startingFrom')} $
                                        {hotel.price}/night
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {relatedTours.length > 0 && (
                <section>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('destinationDetail.suggestedTours')}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedTours.map((tour) => (
                            <Link
                                key={tour.slug}
                                to={`/tours/${tour.slug}`}
                                className="card-elevated group overflow-hidden rounded-2xl bg-card"
                            >
                                <div className="h-40 overflow-hidden">
                                    <img
                                        src={tour.image}
                                        alt={localize(tour.name, lang)}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-serif font-bold text-foreground">
                                        {localize(tour.name, lang)}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {localize(tour.duration, lang)} ·{' '}
                                        {t('destinationDetail.startingFrom')} $
                                        {tour.price.toLocaleString()}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </PageShell>
    );
}
