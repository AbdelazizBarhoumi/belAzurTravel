import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useTours, useCategories, useCategoryTypesPublic } from '@/hooks/usePublicData';

import { getLocalizedCategoryLabel } from '@/lib/categoryLabels';
import { matchesFilterValue, matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const Tours = () => {
    const { t, lang } = useLanguage();
    const [params] = useSearchParams();
    // Accept landing widget destination param as fallback for q
    const initialSearch = params.get('q') || params.get('destination') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || ALL;
    const initialDuration = params.get('duration')?.toLowerCase() || ALL;
    const initialGuests = Number(params.get('guests') || 2);
    const initialFromDate = params.get('from') || '';
    const initialToDate = params.get('to') || '';

    const { data: tours = [] } = useTours();
    const { data: dynamicCategories = [] } = useCategories('tours');
    const { data: categoryTypes = [] } = useCategoryTypesPublic('tours');

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
    const [selectedLocation, setSelectedLocation] = useState(ALL);
    const [selectedDuration, setSelectedDuration] = useState(initialDuration);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [travelers, setTravelers] = useState(
        Number.isFinite(initialGuests) && initialGuests > 0 ? initialGuests : 2,
    );
    const [fromDate, setFromDate] = useState(initialFromDate);
    const [toDate, setToDate] = useState(initialToDate);

    // Initial state is derived from URL params via useState above; no synchronous effect needed

    const categories = useMemo(
        () => [
            { value: ALL, label: t('common.all') },
            ...dynamicCategories.map((c) => ({
                value: c.key.toLowerCase(),
                label: getLocalizedCategoryLabel(c, lang),
            })),
        ],
        [dynamicCategories, lang, t],
    );

    const locationOptions = useMemo(
        () =>
            Array.from(
                new Set(tours.map((tour) => localizeText(tour.location, lang))),
            ).map(String),
        [tours, lang],
    );
    const durationOptions = useMemo(
        () =>
            Array.from(
                new Set(tours.map((tour) => localizeText(tour.duration, lang))),
            ).map(String),
        [tours, lang],
    );

    const filteredTours = useMemo(
        () =>
            tours.filter((tour) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(tour.name, lang),
                    localizeText(tour.location, lang),
                    localizeText(tour.duration, lang),
                    localizeText(tour.description, lang),
                ]);
                const matchesLocation =
                    selectedLocation === ALL ||
                    localizeText(tour.location, lang) === selectedLocation;
                const matchesDuration =
                    selectedDuration === ALL ||
                    matchesFilterValue(selectedDuration, [tour.duration]);
                const matchesCategory =
                    selectedCategory === ALL ||
                    (tour.category_key ?? '').toLowerCase() ===
                        selectedCategory;
                const matchesTravelers = tour.maxGroup >= travelers;
                const tourAssignments = tour.category_assignments;
                const matchesCategoryTypes = Object.entries(categoryTypeFilters).every(
                    ([typeKey, values]) =>
                        values.length === 0 ||
                        (tourAssignments && values.includes(tourAssignments[typeKey])),
                );

                return (
                    matchesSearch &&
                    matchesLocation &&
                    matchesDuration &&
                    matchesCategory &&
                    matchesTravelers &&
                    matchesCategoryTypes
                );
            }),
        [
            tours,
            lang,
            searchQuery,
            selectedLocation,
            selectedDuration,
            selectedCategory,
            travelers,
            categoryTypeFilters,
        ],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedLocation !== ALL ||
        selectedDuration !== ALL ||
        selectedCategory !== ALL ||
        travelers !== 2 ||
        fromDate !== '' ||
        toDate !== '' ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLocation(ALL);
        setSelectedDuration(ALL);
        setSelectedCategory(ALL);
        setTravelers(2);
        setFromDate('');
        setToDate('');
        setCategoryTypeFilters({});
    };

    return (
        <div
            key={params.toString()}
            className="flex min-h-screen flex-col bg-background"
        >
            <PageHeroCarousel pageKey="tours" />
            <div className="flex-1 pb-16 pt-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.tours'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('tours.title')}
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {t('tours.subtitle')}
                        </p>
                    </motion.div>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredTours.length}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        searchPlaceholder={t('common.search')}
                    >
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <label className="grid gap-2 text-sm">
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('search.fields.dates')}
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker
                                        date={
                                            fromDate
                                                ? new Date(fromDate)
                                                : undefined
                                        }
                                        onDateChange={(date) =>
                                            setFromDate(
                                                date
                                                    ? date
                                                          .toISOString()
                                                          .split('T')[0]
                                                    : '',
                                            )
                                        }
                                        placeholder={t(
                                            'search.placeholders.checkIn',
                                        )}
                                    />
                                    <DatePicker
                                        date={
                                            toDate
                                                ? new Date(toDate)
                                                : undefined
                                        }
                                        onDateChange={(date) =>
                                            setToDate(
                                                date
                                                    ? date
                                                          .toISOString()
                                                          .split('T')[0]
                                                    : '',
                                            )
                                        }
                                        placeholder={t(
                                            'search.placeholders.checkOut',
                                        )}
                                    />
                                </div>
                            </label>

                            <label className="grid gap-2 text-sm">
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('search.fields.travelers')}
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={travelers}
                                    onChange={(event) =>
                                        setTravelers(
                                            Math.max(
                                                1,
                                                Number(event.target.value) || 1,
                                            ),
                                        )
                                    }
                                    className="h-12 rounded-2xl border border-border/70 bg-background/90 px-3 text-sm shadow-sm"
                                    aria-label={t('search.fields.travelers')}
                                />
                            </label>
                        </div>

                        <div className="mb-6 flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory(cat.value)
                                    }
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedCategory === cat.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                            <label className="grid gap-2 text-sm">
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('tours.filterByLocation')}
                                </span>
                                <Select
                                    value={selectedLocation}
                                    onValueChange={setSelectedLocation}
                                >
                                    <SelectTrigger
                                        aria-label={t('tours.filterByLocation')}
                                        className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                                    >
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>
                                            {t('common.all')}
                                        </SelectItem>
                                        {locationOptions.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>

                            <label className="grid gap-2 text-sm">
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('tours.filterByDuration')}
                                </span>
                                <Select
                                    value={selectedDuration}
                                    onValueChange={setSelectedDuration}
                                >
                                    <SelectTrigger
                                        aria-label={t('tours.filterByDuration')}
                                        className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                                    >
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>
                                            {t('common.all')}
                                        </SelectItem>
                                        {durationOptions.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>
                        {categoryTypes.length > 0 && (
                            <div className="space-y-2">
                                {categoryTypes.map((catType) => (
                                    <FilterRenderer
                                        key={catType.key}
                                        categoryType={catType as never}
                                        selectedValues={categoryTypeFilters[catType.key] ?? []}
                                        onChange={(values) =>
                                            setCategoryTypeFilters((prev) => ({
                                                ...prev,
                                                [catType.key]: values,
                                            }))
                                        }
                                        lang={lang}
                                    />
                                ))}
                            </div>
                        )}
                    </ListFilterBar>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {filteredTours.length === 0 ? (
                            <RequestThingEmptyState
                                variant={
                                    tours.length === 0 ? 'empty' : 'no-results'
                                }
                                className="lg:col-span-2"
                            />
                        ) : (
                            filteredTours.map((tour, i) => (
                                <Link
                                    key={localizeText(tour.name, lang)}
                                    to={`/tours/${tour.slug}`}
                                    className="group block h-full"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="h-full cursor-pointer"
                                    >
                                        <div className="card-elevated flex h-auto min-h-52 flex-col overflow-hidden rounded-2xl bg-card lg:h-64 lg:flex-row">
                                            <div className="relative h-64 shrink-0 overflow-hidden lg:h-full lg:w-1/3">
                                                <img
                                                    src={tour.image}
                                                    alt={localizeText(
                                                        tour.name,
                                                        lang,
                                                    )}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />

                                                <FavoriteButton
                                                    className="absolute right-3 top-3"
                                                    item={{
                                                        id: `tour-${localizeText(tour.name, lang)}`,
                                                        type: 'tour',
                                                        name: localizeText(
                                                            tour.name,
                                                            lang,
                                                        ),
                                                        image: tour.image,
                                                        price: tour.price,
                                                        location: localizeText(
                                                            tour.location,
                                                            lang,
                                                        ),
                                                    }}
                                                />
                                            </div>

                                            <div className="flex min-w-0 flex-1 flex-col justify-between p-6">
                                                <div>
                                                    <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />{' '}
                                                            {localizeText(
                                                                tour.location,
                                                                lang,
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />{' '}
                                                            {localizeText(
                                                                tour.duration,
                                                                lang,
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />{' '}
                                                            {t('tours.max')}{' '}
                                                            {tour.maxGroup}
                                                        </span>
                                                    </div>

                                                    <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                        {localizeText(
                                                            tour.name,
                                                            lang,
                                                        )}
                                                    </h3>

                                                    <p className="mb-4 text-sm text-muted-foreground">
                                                        {localizeText(
                                                            tour.description,
                                                            lang,
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="mb-1 flex items-center gap-1 text-secondary">
                                                            <Star className="h-3.5 w-3.5 fill-current" />{' '}
                                                            <span className="text-xs font-bold">
                                                                {tour.rating}
                                                            </span>
                                                        </div>

                                                        <span className="text-lg font-bold text-primary">
                                                            {tour.price.toLocaleString()}{' '}
                                                            TND
                                                        </span>

                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            {t('tours.person')}
                                                        </span>
                                                    </div>

                                                    <Button className="text-primary-foreground">
                                                        {t('tours.bookTour')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tours;
