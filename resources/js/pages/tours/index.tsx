import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { DateRange } from 'react-day-picker';
import { TourFilters } from '@/components/filters/TourFilters';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { FilterSidebar } from '@/components/lists/FilterSidebar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useTours, useCategoryTypesPublic } from '@/hooks/usePublicData';
import { TOUR_FILTER_KEYS } from '@/data/tourFilters';

import { matchesFilterValue, matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const Tours = () => {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    const initialSearch = params.get('q') || params.get('destination') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || ALL;
    const initialDuration = params.get('duration')?.toLowerCase() || ALL;
    const initialGuests = Number(params.get('guests') || 2);
    const initialFromDate = params.get('from') || '';
    const initialToDate = params.get('to') || '';

    const { data: tours = [] } = useTours();
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

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [travelers, setTravelers] = useState(
        Number.isFinite(initialGuests) && initialGuests > 0 ? initialGuests : 2,
    );
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: initialFromDate ? new Date(initialFromDate) : undefined,
        to: initialToDate ? new Date(initialToDate) : undefined,
    });

    const maxPrice = tours.length > 0 ? Math.max(...tours.map((t) => t.price)) : 1000;
    const minPrice = tours.length > 0 ? Math.min(...tours.map((t) => t.price)) : 0;

    // Category type filters
    const [categoryTypeFilters, setCategoryTypeFilters] =
        useState<Record<string, string[]>>(initialCategoryTypeFilters);

    // Sync state with URL params when they change (e.g. navbar subcategory links)
    useEffect(() => {
        setSearchQuery(params.get('q') || params.get('destination') || '');
    }, [params]);
    useEffect(() => {
        const filters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                const typeKey = key.slice('category_'.length);
                filters[typeKey] = val.split(',').filter(Boolean);
            }
        }
        setCategoryTypeFilters(filters);
    }, [params]);
    const [tourPriceRange, setTourPriceRange] = useState<[number, number]>([0, 1000]);

    // Sync price range when data loads
    useEffect(() => {
        if (tours.length > 0) {
            setTourPriceRange([minPrice, maxPrice]);
        }
    }, [tours.length, minPrice, maxPrice]);

    const filteredTours = useMemo(
        () =>
            (Array.isArray(tours) ? tours : []).filter((tour) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(tour.name, lang),
                    localizeText(tour.location, lang),
                    localizeText(tour.duration, lang),
                    localizeText(tour.description, lang),
                ]);
                const matchesPrice =
                    tour.price >= tourPriceRange[0] &&
                    tour.price <= tourPriceRange[1];
                const matchesTravelers = tour.maxGroup >= travelers;
                // Check category type filters (OR logic)
                const assignments = tour.category_assignments;
                const activeTypeFilters = Object.entries(categoryTypeFilters).filter(([, v]) => v.length > 0);
                const matchesCategoryTypes = activeTypeFilters.length === 0 ||
                    activeTypeFilters.some(([typeKey, values]) =>
                        assignments && values.includes(assignments[typeKey])
                    );

                return (
                    matchesSearch &&
                    matchesPrice &&
                    matchesTravelers &&
                    matchesCategoryTypes
                );
            }),
        [
            tours,
            lang,
            searchQuery,
            tourPriceRange,
            travelers,
            categoryTypeFilters,
        ],
    );

    const hasActiveCategoryTypeFilters = Object.values(categoryTypeFilters).some((v) => v.length > 0);
    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        hasActiveCategoryTypeFilters;

    const clearFilters = () => {
        setSearchQuery('');
        setCategoryTypeFilters({});
        setTourPriceRange([minPrice, maxPrice]);
        setDateRange(undefined);
    };

    return (
        <div
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
                        className="mb-8"
                        inline
                    >
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </ListFilterBar>

                    <div className={`flex gap-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <FilterSidebar
                            title={t('hotels.filters')}
                            hasActiveFilters={hasActiveFilters}
                            onClearAll={clearFilters}
                            clearLabel={t('common.viewAll')}
                            dir={dir}
                        >
                            <TourFilters
                                lang={lang}
                                categoryTypes={categoryTypes}
                                categoryTypeFilters={categoryTypeFilters}
                                onCategoryTypeChange={(typeKey, values) =>
                                    setCategoryTypeFilters((prev) => ({ ...prev, [typeKey]: values }))
                                }
                                priceRange={tourPriceRange}
                                onPriceChange={setTourPriceRange}
                                maxPrice={maxPrice}
                                minPrice={minPrice}
                                tours={tours}
                                travelers={travelers}
                                onTravelersChange={setTravelers}
                            />
                        </FilterSidebar>

                        <div className="min-w-0 flex-1">
                            {filteredTours.length === 0 ? (
                                <RequestThingEmptyState
                                    variant={tours.length === 0 ? 'empty' : 'no-results'}
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    {filteredTours.map((tour, i) => (
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
                                                            alt={localizeText(tour.name, lang)}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                        <FavoriteButton
                                                            className="absolute right-3 top-3"
                                                            item={{
                                                                id: `tour-${localizeText(tour.name, lang)}`,
                                                                type: 'tour',
                                                                name: localizeText(tour.name, lang),
                                                                image: tour.image,
                                                                price: tour.price,
                                                                location: localizeText(tour.location, lang),
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex min-w-0 flex-1 flex-col justify-between p-6">
                                                        <div>
                                                            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />{' '}
                                                                    {localizeText(tour.location, lang)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />{' '}
                                                                    {localizeText(tour.duration, lang)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-3 w-3" />{' '}
                                                                    {t('tours.max')} {tour.maxGroup}
                                                                </span>
                                                            </div>
                                                            <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                                {localizeText(tour.name, lang)}
                                                            </h3>
                                                            <p className="mb-4 text-sm text-muted-foreground">
                                                                {localizeText(tour.description, lang)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="mb-1 flex items-center gap-1 text-secondary">
                                                                    <Star className="h-3.5 w-3.5 fill-current" />{' '}
                                                                    <span className="text-xs font-bold">{tour.rating}</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-primary">
                                                                    {tour.price.toLocaleString()} TND
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
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tours;
