import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Clock, Plane, Users } from 'lucide-react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { getAirportDisplayName, getCityNameByIata } from '@/data/airports';
import { useFlightById } from '@/hooks/usePublicData';

export default function FlightDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, lang, dir } = useLanguage();
    const [searchParams] = useSearchParams();
    const { data: flight, isLoading } = useFlightById(id);

    const passengers = Number(searchParams.get('passengers') || 1);
    const cabinClass = searchParams.get('cabinClass') || 'economy';

    if (isLoading) {
        return null;
    }

    if (!flight) return <Navigate to="/flights" replace />;

    const routeLabel = `${getAirportDisplayName(flight.from)} → ${getAirportDisplayName(flight.to)}`;
    const DirectionIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <div className="min-h-screen bg-background">
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('flights.title'), href: '/flights' },
                                { label: routeLabel, active: true },
                            ]}
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-10 lg:grid-cols-[2fr_1fr]"
                    >
                        <div>
                            <section className="card-elevated mb-8 rounded-3xl border border-border bg-card p-8">
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                        <Plane className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="font-serif text-3xl font-bold text-foreground">
                                            {localizeText(flight.airline, lang)}
                                        </h1>
                                        <p className="text-sm text-muted-foreground">
                                            {localizeText(flight.stops, lang)} ·{' '}
                                            {localizeText(
                                                flight.details.aircraft,
                                                lang,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6 flex flex-wrap items-center gap-2">
                                    {flight.trip_type && (
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                                            {t(`search.options.${flight.trip_type === 'round-trip' ? 'roundTrip' : flight.trip_type === 'one-way' ? 'oneWay' : 'multiCity'}`)}
                                        </span>
                                    )}
                                    {flight.direct_only && (
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                                            {t('flights.directOnly') || 'Direct flight'}
                                        </span>
                                    )}
                                    {flight.baggage_included && (
                                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-600">
                                            {t('flights.withBaggage') || 'Baggage included'}
                                        </span>
                                    )}
                                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                        {localizeText(flight.stops, lang)}
                                    </span>
                                    {flight.segments && flight.segments.length > 0 && (
                                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                                            {flight.segments.length} {t('flights.segments') || 'segments'}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4 border-y border-border py-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-foreground">
                                            {flight.departure}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {getAirportDisplayName(flight.from)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <Clock className="mb-1 h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            {localizeText(
                                                flight.duration,
                                                lang,
                                            )}
                                        </span>
                                        <DirectionIcon className="mt-1 h-4 w-4" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-foreground">
                                            {flight.arrival}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {getCityNameByIata(flight.to)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                                    {localizeText(
                                        flight.details.cabin,
                                        lang,
                                    ) && (
                                        <div className="rounded-2xl bg-muted/40 p-4">
                                            <p className="mb-1 text-xs text-muted-foreground">
                                                {t('label.cabin')}
                                            </p>
                                            <p className="font-bold text-foreground">
                                                {localizeText(
                                                    flight.details.cabin,
                                                    lang,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {localizeText(
                                        flight.details.baggage,
                                        lang,
                                    ) && (
                                        <div className="rounded-2xl bg-muted/40 p-4">
                                            <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Briefcase className="h-3 w-3" />{' '}
                                                {t('label.baggage')}
                                            </p>
                                            <p className="font-bold text-foreground">
                                                {localizeText(
                                                    flight.details.baggage,
                                                    lang,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {localizeText(
                                        flight.details.aircraft,
                                        lang,
                                    ) && (
                                        <div className="rounded-2xl bg-muted/40 p-4">
                                            <p className="mb-1 text-xs text-muted-foreground">
                                                {t('label.aircraft')}
                                            </p>
                                            <p className="font-bold text-foreground">
                                                {localizeText(
                                                    flight.details.aircraft,
                                                    lang,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {flight.segments && flight.segments.length > 0 && (
                                <section className="card-elevated mb-8 rounded-3xl border border-border bg-card p-8">
                                    <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                                        {t('flights.segments') || 'Flight Segments'}
                                    </h2>
                                    <div className="space-y-4">
                                        {flight.segments.map((seg, index) => (
                                            <div
                                                key={seg.id ?? index}
                                                className="flex items-center gap-4 rounded-2xl border border-border p-4"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                    {index + 1}
                                                </div>
                                                <div className="flex flex-1 items-center gap-6">
                                                    <div className="text-center">
                                                        <p className="font-bold text-foreground">{seg.departure_time}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {getAirportDisplayName(seg.from_airport)}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-1 items-center gap-2 text-muted-foreground">
                                                        <div className="h-px flex-1 bg-border" />
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                        <span className="text-xs">{seg.duration}</span>
                                                        <div className="h-px flex-1 bg-border" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-foreground">{seg.arrival_time}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {getAirportDisplayName(seg.to_airport)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {seg.date && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(seg.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <div className="mb-8 lg:hidden">
                                <StickyBookingCard
                                    price={flight.price}
                                    currency="TND"
                                    title={routeLabel}
                                    description={`${localizeText(flight.airline, lang)} · ${localizeText(flight.stops, lang)}`}
                                    passengers={passengers}
                                    cabinClass={cabinClass}
                                    details={[
                                        ...(localizeText(
                                            flight.details.cabin,
                                            lang,
                                        )
                                            ? [
                                                  {
                                                      label: t('label.cabin'),
                                                      value: localizeText(
                                                          flight.details.cabin,
                                                          lang,
                                                      ),
                                                  },
                                              ]
                                            : []),
                                        ...(localizeText(
                                            flight.details.baggage,
                                            lang,
                                        )
                                            ? [
                                                  {
                                                      label: t('label.baggage'),
                                                      value: localizeText(
                                                          flight.details
                                                              .baggage,
                                                          lang,
                                                      ),
                                                  },
                                              ]
                                            : []),
                                        ...(localizeText(
                                            flight.details.aircraft,
                                            lang,
                                        )
                                            ? [
                                                  {
                                                      label: t(
                                                          'label.aircraft',
                                                      ),
                                                      value: localizeText(
                                                          flight.details
                                                              .aircraft,
                                                          lang,
                                                      ),
                                                  },
                                              ]
                                            : []),
                                    ]}
                                    priceLabel={t(
                                        'flightDetail.totalPerPassenger',
                                    )}
                                    primaryButtonLabel={t(
                                        'flightDetail.bookFlight',
                                    )}
                                    onBook={() =>
                                        window.alert(
                                            t('flightDetail.bookingFlow'),
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <aside className="hidden lg:block lg:pt-6">
                            <StickyBookingCard
                                price={flight.price}
                                currency="TND"
                                title={routeLabel}
                                description={`${localizeText(flight.airline, lang)} · ${localizeText(flight.stops, lang)}`}
                                entityType="flight"
                                itemId={String(flight.id)}
                                passengers={passengers}
                                cabinClass={cabinClass}
                                details={[
                                    ...(localizeText(flight.details.cabin, lang)
                                        ? [
                                              {
                                                  label: t('label.cabin'),
                                                  value: localizeText(
                                                      flight.details.cabin,
                                                      lang,
                                                  ),
                                              },
                                          ]
                                        : []),
                                    ...(localizeText(
                                        flight.details.baggage,
                                        lang,
                                    )
                                        ? [
                                              {
                                                  label: t('label.baggage'),
                                                  value: localizeText(
                                                      flight.details.baggage,
                                                      lang,
                                                  ),
                                              },
                                          ]
                                        : []),
                                    ...(localizeText(
                                        flight.details.aircraft,
                                        lang,
                                    )
                                        ? [
                                              {
                                                  label: t('label.aircraft'),
                                                  value: localizeText(
                                                      flight.details.aircraft,
                                                      lang,
                                                  ),
                                              },
                                          ]
                                        : []),
                                ]}
                                priceLabel={t('flightDetail.totalPerPassenger')}
                                primaryButtonLabel={t(
                                    'flightDetail.bookFlight',
                                )}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
