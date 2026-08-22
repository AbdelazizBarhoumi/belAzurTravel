import { motion } from 'framer-motion';
import { Users, Fuel, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useCars } from '@/hooks/usePublicData';

interface Props {
    config: LandingSectionConfig;
}

export function CarsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: cars = [] } = useCars();

    const title =
        config.title?.[lang] ?? config.title?.en ?? t('home.featuredCars');
    const subtitle =
        config.subtitle?.[lang] ??
        config.subtitle?.en ??
        t('home.featuredCarsDesc');
    if (cars.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        const items = cars.slice(0, 6).map((car) => ({
            id: car.slug,
            title: localizeText(car.name, lang),
            price: `${car.price} TND/day`,
            meta: `${car.seats} seats · ${localizeText(car.fuel, lang)}`,
            image: car.image,
            href: `/cars/${car.slug}`,
        }));
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/cars"
                items={items}
                accent="primary"
            />
        );
    }

    if (style === 'cards') {
        const items = cars.slice(0, 3);
        return (
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">
                            {title}
                        </h2>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {subtitle}
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((car, i) => (
                            <Link
                                key={car.slug}
                                to={`/cars/${car.slug}`}
                                className="group"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={car.image}
                                            alt={localizeText(car.name, lang)}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">
                                            {car.price} TND/day
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-serif text-lg font-bold">
                                            {localizeText(car.name, lang)}
                                        </h3>
                                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />{' '}
                                                {car.seats}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Fuel className="h-3 w-3" />{' '}
                                                {localizeText(car.fuel, lang)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Settings2 className="h-3 w-3" />{' '}
                                                {localizeText(
                                                    car.transmission,
                                                    lang,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // grid — 6 items, 2 rows of 3
    const items = cars.slice(0, 6);
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">
                        {title}
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">
                        {subtitle}
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((car, i) => (
                        <Link
                            key={car.slug}
                            to={`/cars/${car.slug}`}
                            className="group"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={car.image}
                                        alt={localizeText(car.name, lang)}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold shadow-md backdrop-blur">
                                        {car.price} TND/day
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-serif text-lg font-bold">
                                        {localizeText(car.name, lang)}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />{' '}
                                            {car.seats}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Fuel className="h-3 w-3" />{' '}
                                            {localizeText(car.fuel, lang)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Settings2 className="h-3 w-3" />{' '}
                                            {localizeText(
                                                car.transmission,
                                                lang,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
