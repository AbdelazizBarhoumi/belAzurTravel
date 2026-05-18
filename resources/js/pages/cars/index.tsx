import { motion } from 'framer-motion';
import { Users, Fuel, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useCars } from '@/hooks/usePublicData';
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const Cars = () => {
    const { t, lang } = useLanguage();
    const { data: cars = [] } = useCars();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(ALL);
    const [selectedFuel, setSelectedFuel] = useState(ALL);
    const [selectedTransmission, setSelectedTransmission] = useState(ALL);
    const [selectedSeats, setSelectedSeats] = useState(ALL);

    const categoryOptions = useMemo(
        () =>
            Array.from(
                new Set(cars.map((car) => localizeText(car.category, lang))),
            ),
        [cars, lang],
    );
    const fuelOptions = useMemo(
        () =>
            Array.from(
                new Set(cars.map((car) => localizeText(car.fuel, lang))),
            ),
        [cars, lang],
    );
    const transmissionOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    cars.map((car) => localizeText(car.transmission, lang)),
                ),
            ),
        [cars, lang],
    );
    const seatOptions = useMemo(
        () =>
            Array.from(new Set(cars.map((car) => String(car.seats)))).sort(
                (a, b) => Number(a) - Number(b),
            ),
        [cars],
    );

    const filteredCars = useMemo(
        () =>
            cars.filter((car) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(car.name, lang),
                    localizeText(car.category, lang),
                    localizeText(car.fuel, lang),
                    localizeText(car.transmission, lang),
                    localizeText(car.description, lang),
                    (car.features ?? [])
                        .map((feature: unknown) =>
                            localizeText(feature as never, lang),
                        )
                        .join(' '),
                    (car.policy ?? [])
                        .map((rule: unknown) =>
                            localizeText(rule as never, lang),
                        )
                        .join(' '),
                ]);
                const matchesCategory =
                    selectedCategory === ALL ||
                    localizeText(car.category, lang) === selectedCategory;
                const matchesFuel =
                    selectedFuel === ALL ||
                    localizeText(car.fuel, lang) === selectedFuel;
                const matchesTransmission =
                    selectedTransmission === ALL ||
                    localizeText(car.transmission, lang) ===
                        selectedTransmission;
                const matchesSeats =
                    selectedSeats === ALL ||
                    String(car.seats) === selectedSeats;

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesFuel &&
                    matchesTransmission &&
                    matchesSeats
                );
            }),
        [
            cars,
            lang,
            searchQuery,
            selectedCategory,
            selectedFuel,
            selectedTransmission,
            selectedSeats,
        ],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedCategory !== ALL ||
        selectedFuel !== ALL ||
        selectedTransmission !== ALL ||
        selectedSeats !== ALL;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory(ALL);
        setSelectedFuel(ALL);
        setSelectedTransmission(ALL);
        setSelectedSeats(ALL);
    };

    return (
        <PageShell
            titleKey="cars.title"
            subtitleKey="cars.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.cars'), active: true },
            ]}
        >
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                resultCount={filteredCars.length}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                searchPlaceholder={t('common.search')}
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('cars.filterByCategory')}
                        </span>
                        <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                        >
                            <SelectTrigger
                                aria-label={t('cars.filterByCategory')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {categoryOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('cars.filterByFuel')}
                        </span>
                        <Select
                            value={selectedFuel}
                            onValueChange={setSelectedFuel}
                        >
                            <SelectTrigger
                                aria-label={t('cars.filterByFuel')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {fuelOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('cars.filterByTransmission')}
                        </span>
                        <Select
                            value={selectedTransmission}
                            onValueChange={setSelectedTransmission}
                        >
                            <SelectTrigger
                                aria-label={t('cars.filterByTransmission')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {transmissionOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('cars.filterBySeats')}
                        </span>
                        <Select
                            value={selectedSeats}
                            onValueChange={setSelectedSeats}
                        >
                            <SelectTrigger
                                aria-label={t('cars.filterBySeats')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {seatOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>
            </ListFilterBar>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCars.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredCars.map((c, i) => (
                        <Link
                            key={c.slug}
                            to={`/cars/${c.slug}`}
                            className="group block"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="card-elevated overflow-hidden rounded-2xl bg-card"
                            >
                                <div className="h-44 overflow-hidden">
                                    <img
                                        src={c.image}
                                        alt={localizeText(c.name, lang)}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="p-5">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                        {localizeText(c.category, lang)}
                                    </span>
                                    <h3 className="mb-3 mt-1 font-serif text-lg font-bold text-foreground">
                                        {localizeText(c.name, lang)}
                                    </h3>
                                    <div className="mb-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" /> {' '}
                                            {c.seats}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Fuel className="h-3 w-3" /> {' '}
                                            {localizeText(c.fuel, lang)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Settings2 className="h-3 w-3" /> {' '}
                                            {localizeText(c.transmission, lang)}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-primary">
                                            ${c.price}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {t('cars.perDay')}
                                            </span>
                                        </span>
                                        <Button
                                            size="sm"
                                            className="bg-primary text-xs text-primary-foreground"
                                        >
                                            {t('cars.rentNow')}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                )}
            </div>
        </PageShell>
    );
};

export default Cars;
