import { motion } from 'framer-motion';
import { Check, Fuel, Settings2, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { LocalizedText } from '@/api/entities.api';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { PageShell } from '@/components/layout/PageShell';
import { Gallery } from '@/components/media/Gallery';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useCarBySlug } from '@/hooks/usePublicData';

export default function CarDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const { data: car } = useCarBySlug(slug);

    if (!car) {
        return (
            <PageShell>
                <div className="py-12 text-center">
                    <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                        {t('carsDetail.notFound')}
                    </h1>
                    <Button asChild>
                        <Link to="/cars">{t('carsDetail.backToCars')}</Link>
                    </Button>
                </div>
            </PageShell>
        );
    }

    const gallery = car.gallery?.length ? car.gallery : [car.image];

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.cars'), href: '/cars' },
                { label: localizeText(car.name, lang), active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="flex flex-col">
                    <Gallery
                        images={gallery}
                        hotelName={localizeText(car.name, lang)}
                    />

                    <div className="mt-8 lg:hidden">
                        <StickyBookingCard
                            price={car.price}
                            currency="TND"
                            priceLabel={t('common.from')}
                            priceSuffix={t('cars.perDay')}
                            badge={localizeText(car.category, lang)}
                            title={localizeText(car.name, lang)}
                            description={localizeText(car.description, lang)}
                            detailsLayout="grid3"
                            details={[
                                {
                                    label: t('carsDetail.seats'),
                                    value: car.seats,
                                    icon: Users,
                                },
                                {
                                    label: t('carsDetail.fuel'),
                                    value: localizeText(car.fuel, lang),
                                    icon: Fuel,
                                },
                                {
                                    label: t('carsDetail.gearbox'),
                                    value: localizeText(car.transmission, lang),
                                    icon: Settings2,
                                },
                            ]}
                            primaryButtonLabel={t('cars.rentNow')}
                            onBook={() => window.open('/contact', '_self')}
                        />
                    </div>

                    {car.features && car.features.length > 0 && (
                        <section className="mt-8 max-w-3xl">
                            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                {t('carsDetail.features')}
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {car.features?.map((feature: LocalizedText) => (
                                    <div
                                        key={String(feature.en)}
                                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                                    >
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                        <span className="text-sm text-foreground">
                                            {String(
                                                localizeText(feature, lang),
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {car.policy && car.policy.length > 0 && (
                        <section className="mt-8 max-w-3xl">
                            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                                {t('carsDetail.policy')}
                            </h2>
                            <ul className="space-y-3">
                                {(car.policy ?? []).map(
                                    (rule: LocalizedText) => (
                                        <li
                                            key={String(rule.en)}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                            <span>
                                                {String(
                                                    localizeText(rule, lang),
                                                )}
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </section>
                    )}
                </div>

                <aside className="hidden lg:block">
                    <StickyBookingCard
                        price={car.price}
                        currency="TND"
                        priceLabel={t('common.from')}
                        priceSuffix={t('cars.perDay')}
                        badge={localizeText(car.category, lang)}
                        title={localizeText(car.name, lang)}
                        description={localizeText(car.description, lang)}
                        entityType="car"
                        itemId={String(car.id)}
                        detailsLayout="grid3"
                        details={[
                            {
                                label: t('carsDetail.seats'),
                                value: car.seats,
                                icon: Users,
                            },
                            {
                                label: t('carsDetail.fuel'),
                                value: localizeText(car.fuel, lang),
                                icon: Fuel,
                            },
                            {
                                label: t('carsDetail.gearbox'),
                                value: localizeText(car.transmission, lang),
                                icon: Settings2,
                            },
                        ]}
                        primaryButtonLabel={t('cars.rentNow')}
                    />
                </aside>
            </motion.div>
        </PageShell>
    );
}
