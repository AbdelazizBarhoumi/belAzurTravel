import { format } from 'date-fns';
import { arSA, enUS, fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Link, useSearchParams } from 'react-router-dom';
import { ThemeIcons } from '@/components/cards/ThemeIcons';
import { HotelFilters } from '@/components/filters/HotelFilters';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import {
    OccupancyPicker,
    type Occupancy,
} from '@/components/ui/OccupancyPicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/ui/StarRating';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useHotels,
    useHotelSearch,
    useCategoryTypesPublic,
    type HotelSearchResult,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

import { getHotelCategoryLabels } from '@/lib/categoryLabels';
import { matchesSearchText } from '@/lib/listFilters';
import { cn } from '@/lib/utils';
import type { HotelItem } from '@/types/public/hotel.types';

// A card is either a stored browse record or a live result (name/location are
// wider `Record<string, string>` after merging the live spread over browse).
type HotelCard = Omit<HotelItem, 'name' | 'location' | 'category'> &
    Partial<HotelSearchResult>;

type SortValue = 'price_asc' | 'price_desc' | 'stars_desc';

function datePickerLocale(lang: Lang) {
    if (lang === 'ar') return arSA;
    if (lang === 'en') return enUS;
    return fr;
}

function formatDate(date: Date, lang: Lang): string {
    return format(date, 'PPP', { locale: datePickerLocale(lang) });
}

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
    const [occupancy, setOccupancy] = useState<Occupancy>({
        adults:
            Number.isFinite(initialGuests) && initialGuests > 0
                ? initialGuests
                : 2,
        childAges: [],
    });
    const [sort, setSort] = useState<SortValue>('price_asc');
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

    const pricedHotels = hotels.filter((h): h is HotelItem & { price: number } => h.price !== null);
    const maxPrice = pricedHotels.length > 0 ? Math.max(...pricedHotels.map((h) => h.price)) : 1000;
    const minPrice = pricedHotels.length > 0 ? Math.min(...pricedHotels.map((h) => h.price)) : 0;

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
        occupancy.adults !== 2 ||
        occupancy.childAges.length > 0 ||
        dateRange?.from !== undefined ||
        dateRange?.to !== undefined;

    const hasActiveCategoryTypeFilters = Object.values(categoryTypeFilters).some((v) => v.length > 0);

    // Phase E: once a full date range (+ occupancy) is chosen, the list is
    // server-driven — the filter bar maps to the server search request
    // (stars, price range, sort, rooms with child ages). Client-side
    // filtering is removed for those server-owned dimensions.
    const hasDates = Boolean(dateRange?.from && dateRange?.to);
    const from = dateRange?.from;
    const to = dateRange?.to;

    // Server `stars` is a minimum threshold; if the user picked star levels,
    // honor the strictest (lowest) selected value.
    const selectedStarValues = Object.entries(categoryTypeFilters)
        .filter(([key, values]) => key.startsWith('dynamic_star_') && values.length > 0)
        .flatMap(([, values]) => values.map((v) => Number(v)))
        .filter((v) => Number.isFinite(v));
    const starsFilter = selectedStarValues.length > 0
        ? Math.min(...selectedStarValues)
        : undefined;

    // The browse slider is per-night; the server price filter is stay-total,
    // so convert the slider bounds with the fixed stay length.
    const nights = from && to
        ? Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
        : 0;
    const priceFilterActive =
        (hotelPriceRange[0] !== minPrice || hotelPriceRange[1] !== maxPrice) && nights > 0;

    const searchQueryForLive = useMemo(() => {
        if (!from || !to) {
            return undefined;
        }

        return {
            check_in: from.toISOString().slice(0, 10),
            check_out: to.toISOString().slice(0, 10),
            rooms: [
                {
                    adults: occupancy.adults,
                    children: occupancy.childAges,
                },
            ],
            only_available: true,
            ...(starsFilter !== undefined ? { stars: starsFilter } : {}),
            ...(priceFilterActive
                ? {
                      price_min: Math.round(hotelPriceRange[0] * nights),
                      price_max: Math.round(hotelPriceRange[1] * nights),
                  }
                : {}),
            sort,
            per_page: 50,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, occupancy.adults, occupancy.childAges, starsFilter, hotelPriceRange[0], hotelPriceRange[1], priceFilterActive, nights, sort]);

    const { data: liveResult } = useHotelSearch(searchQueryForLive);
    const liveResults = useMemo(() => liveResult?.data ?? [], [liveResult]);

    const browseBySlug = useMemo(
        () => new Map(hotels.map((h) => [h.slug, h as HotelCard])),
        [hotels],
    );
    const liveLoaded = hasDates && liveResult !== undefined;
    // Live results carry the price/availability; the stored browse record
    // supplies the richer card metadata (amenities, category assignments).
    const baseList: HotelCard[] = liveLoaded
        ? liveResults.map((live) => {
              const browse = browseBySlug.get(live.slug);
              return browse
                  ? ({ ...browse, ...live } as unknown as HotelCard)
                  : (live as unknown as HotelCard);
          })
        : (hotels as HotelCard[]);

    // Server-owned dimensions (stars, price, sort, occupancy, dates) are NOT
    // filtered here. Only app-level refinements the provider can't express
    // (search text, category assignments, country) apply client-side.
    const filteredHotels = baseList.filter((hotel) => {
        const matchesSearch = matchesSearchText(searchQuery, [
            localizeText(hotel.name, lang),
            localizeText(hotel.location, lang),
            localizeText(hotel.country, lang),
            localizeText(hotel.city, lang),
            (hotel.tags ?? []).join(' '),
        ]);
        const assignments = hotel.category_assignments;
        const activeTypeFilters = Object.entries(categoryTypeFilters)
            .filter(([, v]) => v.length > 0)
            .filter(([key]) => !key.startsWith('dynamic_star_'));
        const matchesCategoryTypes = activeTypeFilters.length === 0 ||
            activeTypeFilters.some(([typeKey, values]) => {
                // Handle dynamic filters (country)
                if (typeKey.startsWith('dynamic_country_')) {
                    const hotelCountry = hotel.country && typeof hotel.country === 'object' ? hotel.country.en : '';
                    return values.includes(hotelCountry);
                }
                // Handle regular category type filters
                return assignments && values.includes(assignments[typeKey]);
            });
        return matchesSearch && matchesCategoryTypes;
    });

    // The shared date picker is always bounded to the earliest day any
    // displayed hotel is available from, so users can't pick a window before
    // any hotel can be booked.
    const pickerMinDate = useMemo(() => {
        const dates = filteredHotels
            .map((h) => h.first_available_at)
            .filter((d): d is string => Boolean(d))
            .map((d) => new Date(`${d}T00:00:00`))
            .filter((d) => !Number.isNaN(d.getTime()));
        if (dates.length === 0) return undefined;
        return new Date(Math.min(...dates.map((d) => d.getTime())));
    }, [filteredHotels]);

    const handleClearAll = () => {
        setSearchQuery('');
        setCategoryTypeFilters({});
        setHotelPriceRange([minPrice, maxPrice]);
        setDateRange(undefined);
    };

    const isRtl = dir === 'rtl';

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
                        {liveLoaded && liveResults.length > 0 && (
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
                            hasActiveCategoryTypeFilters ||
                            priceFilterActive ||
                            sort !== 'price_asc'
                        }
                        onClearFilters={handleClearAll}
                        searchPlaceholder={t('common.search')}
                        className="mb-8"
                        inline
                    >
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            fromDate={pickerMinDate}
                        />
                        <OccupancyPicker
                            value={occupancy}
                            onChange={setOccupancy}
                        />
                        <Select
                            value={sort}
                            onValueChange={(v) => setSort(v as SortValue)}
                        >
                            <SelectTrigger
                                aria-label={t('hotels.sortBy')}
                                className="h-10 sm:h-12 w-44 rounded-xl sm:rounded-2xl border-border/70 bg-background/80 px-3 text-xs sm:text-sm shadow-sm sm:h-12"
                            >
                                <SelectValue placeholder={t('hotels.sortDefault')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="price_asc">
                                    {t('hotels.sortPriceAsc')}
                                </SelectItem>
                                <SelectItem value="price_desc">
                                    {t('hotels.sortPriceDesc')}
                                </SelectItem>
                                <SelectItem value="stars_desc">
                                    {t('hotels.sortStarsDesc')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </ListFilterBar>

                    {/* Main Layout: Sidebar + Content */}
                    <div
                        className={`flex gap-6 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <motion.aside
                            initial={{
                                opacity: 0,
                                x: isRtl ? 100 : -100,
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
                                    {(hasActiveCategoryTypeFilters || priceFilterActive) && (
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
                                    occupancy={occupancy}
                                    onOccupancyChange={setOccupancy}
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
                                    {filteredHotels.map((hotel, index) => {
                                        const unavailable = hotel.available === false;
                                        return (
                                            <motion.article
                                                key={hotel.slug}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={cn(
                                                    unavailable &&
                                                        'opacity-60 grayscale',
                                                )}
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
                                                            {liveLoaded ? (
                                                                <>
                                                                    {hotel.price_total?.toLocaleString()}{' '}
                                                                    {hotel.currency ?? 'TND'}
                                                                    {hotel.nights
                                                                        ? ` · ${hotel.nights} ${t('hotelDetail.nightsLabel')}`
                                                                        : ''}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {t(
                                                                        'hotels.priceFrom',
                                                                    )}{' '}
                                                                    {hotel.price !== null ? (
                                                                        <>
                                                                            {hotel.price.toLocaleString()}{' '}
                                                                            TND
                                                                            {t(
                                                                                'hotelDetail.pernight',
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        t('hotelDetail.noPrice')
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>

                                                        {liveLoaded && (
                                                            <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between gap-2">
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                                                                        hotel.provider === 'manual'
                                                                            ? 'bg-muted text-muted-foreground'
                                                                            : 'bg-primary/90 text-primary-foreground',
                                                                    )}
                                                                >
                                                                    {hotel.provider === 'manual'
                                                                        ? t('hotels.manualBadge')
                                                                        : t('hotels.providerBadge')}
                                                                </span>
                                                                {unavailable && (
                                                                    <span className="inline-flex items-center rounded-full bg-red-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                                                                        {t('hotels.unavailable')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-5">
                                                        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {localizeText(
                                                                hotel.location,
                                                                lang,
                                                            )}
                                                        </div>

                                                        {hotel.first_available_at && (
                                                            <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-primary">
                                                                <CalendarDays className="h-3.5 w-3.5" />
                                                                {t('hotelDetail.availableFrom')}{' '}
                                                                {formatDate(
                                                                    new Date(
                                                                        `${hotel.first_available_at}T00:00:00`,
                                                                    ),
                                                                    lang,
                                                                )}
                                                                {hotel.min_nights &&
                                                                    hotel.min_nights > 1 &&
                                                                    ` · ${t('hotelDetail.minimumNights')} ${hotel.min_nights}`}
                                                            </div>
                                                        )}

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

                                                        {(liveLoaded && hotel.promotion?.rate) ||
                                                            (liveLoaded &&
                                                                hotel.free_child?.length) ? (
                                                            <div className="mb-3 flex flex-wrap gap-2">
                                                                {hotel.promotion?.rate && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                                                        {t('hotelDetail.promo')}{' '}
                                                                        {hotel.promotion.title}
                                                                    </span>
                                                                )}
                                                                {hotel.free_child?.length ? (
                                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                        {t('hotelDetail.freeChild')}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        ) : null}

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
                                                            <ThemeIcons tags={hotel.tags ?? []} amenities={hotel.amenities} maxVisible={8} />
                                                            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                                                                {liveLoaded &&
                                                                    typeof hotel.price_per_night === 'number' && (
                                                                        <span className="text-sm font-bold text-primary">
                                                                            {hotel.price_per_night.toLocaleString()}{' '}
                                                                            {hotel.currency ?? 'TND'}
                                                                            {t('hotelDetail.pernight')}
                                                                        </span>
                                                                    )}
                                                                <span className="text-xs font-medium text-primary">
                                                                    {t('common.viewAll')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>{' '}
                    </div>
                </div>
            </main>
        </div>
    );
}
