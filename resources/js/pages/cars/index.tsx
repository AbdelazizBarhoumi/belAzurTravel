import { motion } from 'framer-motion';
import { Users, Fuel, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { PageShell } from '@/components/layout/PageShell';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
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
import { useCars, useCategories, useCategoryTypesPublic } from '@/hooks/usePublicData';
import { CategoryTypeFilter } from '@/components/lists/CategoryTypeFilter';
import { getLocalizedCategoryLabel } from '@/lib/categoryLabels';
import { matchesSearchText } from '@/lib/listFilters';
import { uniqueNonEmptySelectOptions } from '@/lib/selectOptions';

const ALL = 'all';

export default function Cars() {
    const location = useLocation();
    return <CarsContent key={location.search} />;
}

function CarsContent() {
    const { t, lang } = useLanguage();
    const [params] = useSearchParams();
    const initialSearch = params.get('q') || '';
    const initialCategory = params.get('type')?.toLowerCase() || ALL;

    const { data: cars = [] } = useCars();
    const { data: dynamicCategories = [] } = useCategories('cars');
    const { data: categoryTypes = [] } = useCategoryTypesPublic('cars');

    const initialCategoryTypeFilters = useMemo(() => {
        const filters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                const typeKey = key.slice('category_'.length);
                filters[typeKey] = val.split(',').filter(Boolean);
            }
        }
        return filters;
    }, [params]);
    const [categoryTypeFilters, setCategoryTypeFilters] =
        useState<Record<string, string[]>>(initialCategoryTypeFilters);

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedFuel, setSelectedFuel] = useState(ALL);
    const [selectedTransmission, setSelectedTransmission] = useState(ALL);
    const [selectedSeats, setSelectedSeats] = useState(ALL);

    const categoryOptions = useMemo(
        () => [
            { value: ALL, label: t('common.all') },
            ...dynamicCategories.map((c) => ({
                value: c.key,
                label: getLocalizedCategoryLabel(c, lang),
            })),
        ],
        [dynamicCategories, lang, t],
    );

    const fuelOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                cars.map((car) => localizeText(car.fuel, lang)),
            ),
        [cars, lang],
    );
    const transmissionOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                cars.map((car) => localizeText(car.transmission, lang)),
            ),
        [cars, lang],
    );
    const seatOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                cars.map((car) => String(car.seats)),
            ).sort((a, b) => Number(a) - Number(b)),
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
                    car.category_key === selectedCategory;
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
                const carEntity = car as unknown as Record<string, unknown>;
                const carAssignments = carEntity.category_assignments as Record<string, string> | undefined;
                const matchesCategoryTypes = Object.entries(categoryTypeFilters).every(
                    ([typeKey, values]) =>
                        values.length === 0 ||
                        (carAssignments && values.includes(carAssignments[typeKey])),
                );

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesFuel &&
                    matchesTransmission &&
                    matchesSeats &&
                    matchesCategoryTypes
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
            categoryTypeFilters,
        ],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedCategory !== ALL ||
        selectedFuel !== ALL ||
        selectedTransmission !== ALL ||
        selectedSeats !== ALL ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory(ALL);
        setSelectedFuel(ALL);
        setSelectedTransmission(ALL);
        setSelectedSeats(ALL);
        setCategoryTypeFilters({});
    };

    return (
        <>
        <PageHeroCarousel pageKey="cars" />
        <PageShell
            key={params.toString()}
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
                                {categoryOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
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
                {categoryTypes.length > 0 && (
                    <div className="border-t border-border/50 pt-4">
                        <CategoryTypeFilter
                            categoryTypes={categoryTypes as never}
                            selectedFilters={categoryTypeFilters}
                            onFilterChange={(typeKey, values) =>
                                setCategoryTypeFilters((prev) => ({
                                    ...prev,
                                    [typeKey]: values,
                                }))
                            }
                            lang={lang}
                        />
                    </div>
                )}
            </ListFilterBar>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCars.length === 0 ? (
                    <RequestThingEmptyState
                        variant={cars.length === 0 ? 'empty' : 'no-results'}
                        className="sm:col-span-2 lg:col-span-3"
                    />
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
                                            <Users className="h-3 w-3" />{' '}
                                            {c.seats}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Fuel className="h-3 w-3" />{' '}
                                            {localizeText(c.fuel, lang)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Settings2 className="h-3 w-3" />{' '}
                                            {localizeText(c.transmission, lang)}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-primary">
                                            {c.price} TND
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
        </>
    );
}
