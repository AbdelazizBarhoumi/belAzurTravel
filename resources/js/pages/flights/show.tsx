import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Clock, Plane } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useFlightById } from '@/hooks/usePublicData';

export default function FlightDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, lang, dir } = useLanguage();
    const { data: flight, isLoading } = useFlightById(id);

    if (isLoading) {
        return null;
    }

    if (!flight) return <Navigate to="/flights" replace />;

    const routeLabel = `${flight.from} → ${localizeText(flight.to, lang)}`;
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

                                <div className="grid grid-cols-3 items-center gap-4 border-y border-border py-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-foreground">
                                            {flight.departure}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {flight.from}
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
                                            {localizeText(flight.to, lang)}
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

                            <div className="mb-8 lg:hidden">
                                <StickyBookingCard
                                    price={flight.price}
                                    currency="TND"
                                    title={routeLabel}
                                    description={`${localizeText(flight.airline, lang)} · ${localizeText(flight.stops, lang)}`}
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
