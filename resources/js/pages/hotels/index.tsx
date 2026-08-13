import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Link, useSearchParams } from 'react-router-dom';
import { AmenityIcons } from '@/components/cards/AmenityIcons';
import { HotelFilters } from '@/components/filters/HotelFilters';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { StarRating } from '@/components/ui/StarRating';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useHotels,
    useHotelSearch,
    useCategoryTypesPublic,
} from '@/hooks/usePublicData';

import { getHotelCategoryLabels } from '@/lib/categoryLabels';
import { matchesSearchText } from '@/lib/listFilters';

export default function Hotels() {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    // Accept landing widget params as fallback (destination -> q)
    const initialSearch = params.get('q') || params.get('destination') || '';
    const initialGuests = Number(params.get('guests') || 2);
    const initialFromDate = params.get('from') || '';
    const initialToDate = params.get('to') || '';
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    // referenced to satisfy linter until mobile filter UI is implemented
    void showMobileFilter;
    void setShowMobileFilter;
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [guests, setGuests] = useState(
        Number.isFinite(initialGuests) && initialGuests > 0 ? initialGuests : 2,
    );
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: initialFromDate ? new Date(initialFromDate) : undefined,
        to: initialToDate ? new Date(initialToDate) : undefined,
    });
    const { data: hotels = [] } = useHotels();
    const { data: categoryTypes = [] } = useCategoryTypesPublic('hotels');

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

    const maxPrice = hotels.length > 0 ? Math.max(...hotels.map((h) => h.price)) : 1000;
    const minPrice = hotels.length > 0 ? Math.min(...hotels.map((h) => h.price)) : 0;

    // Category type filters state
    const [categoryTypeFilters, setCategoryTypeFilters] =
        useState<Record<string, string[]>>(initialCategoryTypeFilters);

    // Adjust state during render when URL params change (e.g. navbar subcategory links)
    const [prevParamsKey, setPrevParamsKey] = useState(() => params.toString());
    if (params.toString() !== prevParamsKey) {
        setPrevParamsKey(params.toString());
        setSearchQuery(params.get('q') || params.get('destination') || '');
        const nextFilters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                nextFilters[key.slice('category_'.length)] = val.split(',').filter(Boolean);
            }
        }
        setCategoryTypeFilters(nextFilters);
    }
    const [hotelPriceRange, setHotelPriceRange] = useState<[number, number]>([0, 1000]);

    // Adjust state during render when data loads (price range derived from hotels)
    const [priceRangeSynced, setPriceRangeSynced] = useState<readonly [number, number] | null>(null);
    if (
        hotels.length > 0 &&
        (priceRangeSynced === null ||
            priceRangeSynced[0] !== minPrice ||
            priceRangeSynced[1] !== maxPrice)
    ) {
        setPriceRangeSynced([minPrice, maxPrice]);
        setHotelPriceRange([minPrice, maxPrice]);
    }

    const hasLandingDateOrGuestFilters =
        guests !== 2 || dateRange?.from !== undefined || dateRange?.to !== undefined;

    const hasActiveCategoryTypeFilters = Object.values(categoryTypeFilters).some((v) => v.length > 0);
    const filteredHotels =
        searchQuery.trim().length === 0 &&
        hotelPriceRange[0] === minPrice &&
        hotelPriceRange[1] === maxPrice &&
        !hasActiveCategoryTypeFilters
            ? hotels
            : hotels.filter((hotel) => {
                  const matchesSearch = matchesSearchText(searchQuery, [
                      localizeText(hotel.name, lang),
                      localizeText(hotel.location, lang),
                      localizeText(hotel.country, lang),
                      localizeText(hotel.city, lang),
                      (hotel.tags ?? []).join(' '),
                  ]);
                  const matchesPrice =
                      hotel.price >= hotelPriceRange[0] &&
                      hotel.price <= hotelPriceRange[1];
                  // Check category type filters (OR logic)
                  const assignments = hotel.category_assignments;
                  const activeTypeFilters = Object.entries(categoryTypeFilters).filter(([, v]) => v.length > 0);
                  const matchesCategoryTypes = activeTypeFilters.length === 0 ||
                      activeTypeFilters.some(([typeKey, values]) => {
                          // Handle dynamic filters (country, stars)
                          if (typeKey.startsWith('dynamic_country_')) {
                              const hotelCountry = hotel.country && typeof hotel.country === 'object' ? hotel.country.en : '';
                              return values.includes(hotelCountry);
                          }
                          if (typeKey.startsWith('dynamic_star_')) {
                              return values.includes(String(hotel.stars));
                          }
                          // Handle regular category type filters
                          return assignments && values.includes(assignments[typeKey]);
                      });
return (
                       matchesSearch &&
                       matchesPrice &&
                       matchesCategoryTypes
                   );
               });

    // Live pricing: auto-trigger a batched HotelSearch once a full date range
    // (plus occupancy) is selected. Results overlay the stored price on cards.
    const searchQueryForLive = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return undefined;
        }
        const visibleSlugs = filteredHotels.map((hotel) => hotel.slug);
        if (visibleSlugs.length === 0) {
            return undefined;
        }

        return {
            check_in: dateRange.from.toISOString().slice(0, 10),
            check_out: dateRange.to.toISOString().slice(0, 10),
            hotel_slugs: visibleSlugs,
            rooms: [{ adults: guests }],
            only_available: true,
        };
    }, [dateRange, filteredHotels, guests]);

    const { data: liveResults = [] } = useHotelSearch(searchQueryForLive);
    const liveBySlug = useMemo(
        () => new Map(liveResults.map((item) => [item.slug, item])),
        [liveResults],
    );
    const hasLivePrices =
        searchQueryForLive !== undefined &&
        (liveResults.length > 0 || liveBySlug.size > 0);

    const handleClearAll = () => {
        setSearchQuery('');
        setCategoryTypeFilters({});
        setHotelPriceRange([minPrice, maxPrice]);
        setDateRange(undefined);
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeroCarousel pageKey="hotels" />
            <main className="pb-16 pt-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.hotels'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('hotels.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('hotels.subtitle')}
                        </p>
                        {hasLivePrices && (
                            <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                {t('hotels.livePrices')}
                            </p>
                        )}
                    </motion.header>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredHotels.length}
                        hasActiveFilters={
                            searchQuery.trim().length > 0 ||
                            hasLandingDateOrGuestFilters ||
                            hasActiveCategoryTypeFilters
                        }
                        onClearFilters={handleClearAll}
                        searchPlaceholder={t('common.search')}
                        className="mb-8"
                        inline
                    >
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </ListFilterBar>

                    {/* Main Layout: Sidebar + Content */}
                    <div
                        className={`flex gap-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <motion.aside
                            initial={{
                                opacity: 0,
                                x: dir === 'rtl' ? 100 : -100,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className="hidden flex-shrink-0 md:block md:w-72"
                        >
                            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
                                <div className="mb-6 flex items-center justify-between gap-4">
                                    <h2 className="font-serif text-lg font-bold text-foreground">
                                        {t('hotels.filters')}
                                    </h2>
                                    {hasActiveCategoryTypeFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            {t('common.viewAll')}
                                        </button>
                                    )}
                                </div>

                                <HotelFilters
                                    hotels={hotels}
                                    lang={lang}
                                    priceRange={hotelPriceRange}
                                    onPriceChange={setHotelPriceRange}
                                    maxPrice={maxPrice}
                                    minPrice={minPrice}
                                    categoryTypes={categoryTypes}
                                    categoryTypeFilters={categoryTypeFilters}
                                    onCategoryTypeChange={(typeKey, values) =>
                                        setCategoryTypeFilters((prev) => ({ ...prev, [typeKey]: values }))
                                    }
                                    guests={guests}
                                    onGuestsChange={setGuests}
                                />
                            </div>
                        </motion.aside>
                        {/* Main Content */}
                        <div className="min-w-0 flex-1">
                            {filteredHotels.length === 0 ? (
                                <RequestThingEmptyState
                                    variant={
                                        hotels.length === 0
                                            ? 'empty'
                                            : 'no-results'
                                    }
                                />
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredHotels.map((hotel, index) => (
                                        <motion.article
                                            key={hotel.slug}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                to={`/hotels/${hotel.slug}`}
                                                className="group block transform-gpu overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                            >
                                                <div className="relative h-56 overflow-hidden">
                                                    <img
                                                        src={hotel.image}
                                                        alt={localizeText(
                                                            hotel.name,
                                                            lang,
                                                        )}
                                                        className="h-full w-full transform-gpu object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />

                                                    <FavoriteButton
                                                        className="absolute left-4 top-4"
                                                        item={{
                                                            id: hotel.slug,
                                                            type: 'hotel',
                                                            name: localizeText(
                                                                hotel.name,
                                                                lang,
                                                            ),
                                                            image: hotel.image,
                                                            price: hotel.price,
                                                            location:
                                                                localizeText(
                                                                    hotel.location,
                                                                    lang,
                                                                ),
                                                        }}
                                                    />

                                                    <div className="absolute right-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-foreground shadow-md backdrop-blur">
                                                        {t('hotels.priceFrom')}{' '}
                                                        {liveBySlug.get(hotel.slug)?.price ?? hotel.price} TND
                                                    </div>
                                                </div>

                                                <div className="p-5">
                                                    <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {localizeText(
                                                            hotel.location,
                                                            lang,
                                                        )}
                                                    </div>

                                                    <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                        {localizeText(
                                                            hotel.name,
                                                            lang,
                                                        )}
                                                    </h3>

                                                    <div className="mb-3 flex items-center gap-3">
                                                        <StarRating
                                                            rating={hotel.stars}
                                                            size="sm"
                                                        />
                                                    </div>

                                                    {(() => {
                                                        const catLabels = getHotelCategoryLabels(hotel.category_assignments, categoryTypes, lang, 3);
                                                        if (catLabels.length === 0) return null;
                                                        return (
                                                            <div className="mb-4 flex flex-wrap gap-2">
                                                                {catLabels.map((label) => (
                                                                    <span key={label} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                                        {label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}

                                                    <div className="flex items-center justify-between gap-4">
                                                        <AmenityIcons amenities={hotel.amenities} maxVisible={8} />
                                                        <span className="shrink-0 text-sm font-semibold text-primary">
                                                            {t('common.viewAll')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    ))}
                                </div>
                            )}
                        </div>{' '}
                    </div>
                </div>
            </main>
        </div>
    );
}
