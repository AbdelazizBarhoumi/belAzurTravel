import { addDays, format } from 'date-fns';
import { arSA, enUS, fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Building2, CalendarDays, Loader2, MapPin, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Link, useSearchParams } from 'react-router-dom';
import { ThemeIcons } from '@/components/cards/ThemeIcons';
import { HotelFilters } from '@/components/filters/HotelFilters';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
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
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useCountryByCode } from '@/hooks/useCountries';
import {
    useHotels,
    useHotelSearch,
    useCategoryTypesPublic,
    type HotelSearchQuery,
    type HotelSearchResult,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

import { getHotelCategoryLabels } from '@/lib/categoryLabels';
import { matchesSearchText } from '@/lib/listFilters';
import { cn, earliestCheckIn, formatPromoRate, promoPrice, toLocalISODate } from '@/lib/utils';
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

// `children` is a comma-separated list of child ages (e.g. "5,8") carried in
// the URL to preserve occupancy across the list <-> detail navigation.
function parseChildAges(raw: string | null): number[] {
    return (raw ?? '')
        .split(',')
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 17);
}

function formatDate(date: Date, lang: Lang): string {
    return format(date, 'PPP', { locale: datePickerLocale(lang) });
}

// Returns the current value immediately and only adopts a new one after the
// value has been stable for `delay` ms — rapid filter changes (price slider
// drags, sort toggles) batch into a single search instead of firing one
// expensive provider-backed request per change.
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// Landing widget "room type" options map onto the `type_chambres` category
// values used by the hotels model.
const ROOM_TYPE_MAP: Record<string, string> = {
    standard: 'chambre_standard',
    deluxe: 'suite_junior',
    suite: 'suite',
};

// Merges every category source into the sidebar filter state:
// - `category_*` query params (navbar subcategory links / shared filters)
// - `stars` param from the landing widget (property class)
// - `cat` param from the landing widget (room type)
// - `country` param from the landing widget (country code -> English name)
function buildCategoryFilters(
    params: URLSearchParams,
    countryEnglishName: string | undefined,
): Record<string, string[]> {
    const filters: Record<string, string[]> = {};

    for (const [key, val] of params.entries()) {
        if (key.startsWith('category_')) {
            const typeKey = key.slice('category_'.length);
            filters[typeKey] = val.split(',').filter(Boolean);
        }
    }

    const starNum = Number((params.get('stars') ?? '').replace(/[^0-9]/g, ''));
    if (Number.isFinite(starNum) && starNum >= 1 && starNum <= 5) {
        filters[`dynamic_star_${starNum}`] = [String(starNum)];
    }

    const roomKey = params.get('cat') ? ROOM_TYPE_MAP[params.get('cat')!] : undefined;
    if (roomKey) {
        filters.type_chambres = [roomKey];
    }

    if (countryEnglishName) {
        filters[`dynamic_country_${countryEnglishName}`] = [countryEnglishName];
    }

    return filters;
}

function HotelCardSkeleton() {
    return (
        <div className="block overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <Skeleton className="h-56 w-full rounded-none" />
            <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
        </div>
    );
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
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [occupancy, setOccupancy] = useState<Occupancy>({
        adults:
            Number.isFinite(initialGuests) && initialGuests > 0
                ? initialGuests
                : 2,
        childAges: parseChildAges(params.get('children')),
    });
    const [sort, setSort] = useState<SortValue>('price_asc');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: initialFromDate ? new Date(initialFromDate) : undefined,
        to: initialToDate ? new Date(initialToDate) : undefined,
    });
    const { data: hotels = [] } = useHotels();
    const { data: categoryTypes = [] } = useCategoryTypesPublic('hotels');

    // The landing widget sends a country *code*; the sidebar country filter
    // matches on the English name, so resolve the code here and reuse it
    // while rebuilding filters from URL changes.
    const countryEnglishName = useCountryByCode(params.get('country'))?.name.en;

    const MIN_PRICE = 0;
    const DEFAULT_MAX_PRICE = 1000;

    // Slider bounds are derived from stored per-night prices so the price
    // control always reflects real data instead of a fixed 0-1000 range.
    const storedPrices = useMemo(
        () =>
            hotels
                .map((h) => h.price)
                .filter(
                    (p): p is number =>
                        typeof p === 'number' && Number.isFinite(p),
                ),
        [hotels],
    );
    const dataMinPrice =
        storedPrices.length > 0
            ? Math.floor(Math.min(...storedPrices))
            : MIN_PRICE;
    const dataMaxPrice =
        storedPrices.length > 0
            ? Math.ceil(Math.max(...storedPrices))
            : DEFAULT_MAX_PRICE;

    // Category type filters state (URL params: navbar subcategory links +
    // landing widget stars/room type/country).
    const [categoryTypeFilters, setCategoryTypeFilters] =
        useState<Record<string, string[]>>(() =>
            buildCategoryFilters(params, countryEnglishName),
        );

    // Adjust state during render when URL params change (e.g. navbar
    // subcategory links or a new landing-widget search).
    const [prevParamsKey, setPrevParamsKey] = useState(() => params.toString());
    if (params.toString() !== prevParamsKey) {
        setPrevParamsKey(params.toString());
        setSearchQuery(params.get('q') || params.get('destination') || '');
        setCategoryTypeFilters(buildCategoryFilters(params, countryEnglishName));
        const fromParam = params.get('from') || '';
        const toParam = params.get('to') || '';
        setDateRange({
            from: fromParam ? new Date(fromParam) : undefined,
            to: toParam ? new Date(toParam) : undefined,
        });
        const guestsParam = Number(params.get('guests') || 2);
        setOccupancy({
            adults:
                Number.isFinite(guestsParam) && guestsParam > 0
                    ? guestsParam
                    : 2,
            childAges: parseChildAges(params.get('children')),
        });
    }

    const [hotelPriceRange, setHotelPriceRange] = useState<
        [number, number]
    >([MIN_PRICE, DEFAULT_MAX_PRICE]);
    // Whether the user moved the slider. This drives the "price filter is
    // active" flag instead of a value comparison, so auto-syncing the slider
    // bounds to the data on screen never counts as a user-driven filter.
    const [priceRangeTouched, setPriceRangeTouched] = useState(false);
    // Tracks the last bounds the slider was synced to.
    const [priceRangeSynced, setPriceRangeSynced] = useState<
        readonly [number, number] | null
    >(null);

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
    // A single check-in date still triggers a live search: check-out defaults
    // to check-in + 1 night so dates, visitors and live prices always apply.
    const from = dateRange?.from;
    const effectiveTo = dateRange?.to ?? (from ? addDays(from, 1) : undefined);
    const hasDates = Boolean(from);

    // Serialize the dates to stable primitives: `effectiveTo` is a fresh Date
    // (addDays) each render, so using the Date objects directly would give the
    // live query a new identity on every render and keep resetting the search
    // debounce. The ISO strings only change when the picked dates change.
    const checkInISO = toLocalISODate(from) ?? '';
    const checkOutISO = toLocalISODate(effectiveTo) ?? '';

    // Star checkboxes form an exact OR group: selecting "3 Stars" shows only
    // 3-star hotels, not "3 stars and up". The server `stars` parameter is a
    // minimum, so the strictest selected value is forwarded as a safe
    // pre-filter for the provider search.
    const selectedStarValues = useMemo(
        () =>
            Object.entries(categoryTypeFilters)
                .filter(
                    ([key, values]) =>
                        key.startsWith('dynamic_star_') && values.length > 0,
                )
                .flatMap(([, values]) => values.map((v) => Number(v)))
                .filter((v) => Number.isFinite(v)),
        [categoryTypeFilters],
    );
    const starsMin = selectedStarValues.length > 0
        ? Math.min(...selectedStarValues)
        : undefined;

    // The browse slider is per-night; the server price filter is stay-total,
    // so convert the slider bounds with the stay length.
    const nights = from && effectiveTo
        ? Math.max(1, Math.round((effectiveTo.getTime() - from.getTime()) / 86_400_000))
        : 0;
    // The price filter is "active" as soon as the user moves the slider; in
    // browse mode it filters stored per-night prices client-side, and once
    // dates are set it is sent to the provider as a per-stay range.
    const priceFilterActive = priceRangeTouched;

    // Client-only refinements (search text, country, category type groups,
    // stars). These work on the browse list AND on the live results; the
    // server-owned dimensions (price, sort, dates, occupancy) are handled by
    // the search itself.
    const clientFilterMatches = useCallback(
        (hotel: HotelCard): boolean => {
            const matchesSearch = matchesSearchText(searchQuery, [
                localizeText(hotel.name, lang),
                localizeText(hotel.location, lang),
                localizeText(hotel.country, lang),
                localizeText(hotel.city, lang),
                (hotel.tags ?? []).join(' '),
            ]);
            if (!matchesSearch) return false;

            // Stars are an exact OR group: only hotels whose star rating is
            // one of the selected values pass.
            if (
                selectedStarValues.length > 0 &&
                !selectedStarValues.includes(hotel.stars ?? 0)
            ) {
                return false;
            }

            // Selected countries form a single OR group.
            const countryKeys = Object.entries(categoryTypeFilters)
                .filter(([key, values]) => key.startsWith('dynamic_country_') && values.length > 0)
                .flatMap(([, values]) => values);
            if (countryKeys.length > 0) {
                const hotelCountry =
                    hotel.country && typeof hotel.country === 'object'
                        ? hotel.country.en
                        : '';
                if (!countryKeys.includes(hotelCountry)) return false;
            }

            // Selected cities form a single OR group (multi-select dropdown).
            const cityKeys = categoryTypeFilters['dynamic_city'] ?? [];
            if (cityKeys.length > 0) {
                const hotelCity =
                    hotel.city && typeof hotel.city === 'object'
                        ? hotel.city.en
                        : '';
                if (!cityKeys.includes(hotelCity)) return false;
            }

            // Category-type groups are AND-ed together (values within a group
            // are OR-ed). Stars are handled above; dynamic filters below are
            // the country group only, so the rest are plain category types.
            const categoryGroups = Object.entries(categoryTypeFilters)
                .filter(([key, values]) => !key.startsWith('dynamic_') && values.length > 0);
            if (categoryGroups.length > 0) {
                return categoryGroups.every(([typeKey, values]) => {
                    const assignments = hotel.category_assignments;
                    if (assignments == null) return false;
                    return values.includes(assignments[typeKey]);
                });
            }

            return true;
        },
        [searchQuery, selectedStarValues, categoryTypeFilters, lang],
    );

    // When client-side refinements are active, narrow the live provider search
    // to the matching browse candidates so each search is a small provider call
    // (≤200 hotels per request) instead of the whole catalog.
    const hasClientFilters =
        searchQuery.trim().length > 0 ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);
    const clientFilteredSlugs = useMemo(() => {
        if (!hasClientFilters) return undefined;
        const slugs = hotels
            .filter((hotel) => clientFilterMatches(hotel as HotelCard))
            .map((hotel) => hotel.slug);
        return slugs.length > 0 && slugs.length <= 200 ? slugs : undefined;
    }, [hotels, hasClientFilters, clientFilterMatches]);

    const searchQueryForLive = useMemo(() => {
        if (!hasDates || !checkInISO || !checkOutISO) {
            return undefined;
        }

        return {
            check_in: checkInISO,
            check_out: checkOutISO,
            ...(clientFilteredSlugs !== undefined
                ? { hotel_slugs: clientFilteredSlugs }
                : {}),
            rooms: [
                {
                    adults: occupancy.adults,
                    children: occupancy.childAges,
                },
            ],
            only_available: true,
            ...(starsMin !== undefined ? { stars: starsMin } : {}),
            ...(priceFilterActive && nights > 0
                ? {
                      price_min: Math.round(hotelPriceRange[0] * nights),
                      price_max: Math.round(hotelPriceRange[1] * nights),
                  }
                : {}),
            sort,
            per_page: 50,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkInISO, checkOutISO, clientFilteredSlugs, occupancy.adults, occupancy.childAges, starsMin, hotelPriceRange[0], hotelPriceRange[1], priceFilterActive, nights, sort]);

    // Rapid filter interactions must not each fire an expensive search; batch
    // them and search once the user settles.
    const liveQuery = useDebouncedValue<HotelSearchQuery | undefined>(
        searchQueryForLive,
        600,
    );

    const { data: liveResult, isFetching: liveFetching } = useHotelSearch(liveQuery);
    const liveResults = useMemo(() => liveResult?.data ?? [], [liveResult]);

    const browseBySlug = useMemo(
        () => new Map(hotels.map((h) => [h.slug, h as HotelCard])),
        [hotels],
    );
    const liveLoaded = hasDates && liveResult !== undefined;
    // Prices only exist once a date picker has produced live results; before
    // that the Budget slider and the price sort control are meaningless and
    // hidden. A hotel with no price must never match a price filter anyway.
    const hasPriceData = liveLoaded;
    // While a date search is in flight (still debouncing or fetching) the
    // stored browse cards carry no prices for the chosen dates, so show
    // skeleton cards instead of misleading placeholders.
    const priceLoading = hasDates && (liveResult === undefined || liveFetching);
    // The slider bounds follow the data on screen: the stored per-night prices
    // in browse mode, and the min/max per-night price of the live results once
    // dates are picked (so the range reflects real availability instead of the
    // stored fallback prices).
    const livePerNightPrices = liveResults
        .map((h) => h.price_per_night)
        .filter((p): p is number => typeof p === 'number');
    const priceBounds: readonly [number, number] =
        liveLoaded && livePerNightPrices.length > 0
            ? [
                  Math.floor(Math.min(...livePerNightPrices)),
                  Math.ceil(Math.max(...livePerNightPrices)),
              ]
            : ([dataMinPrice, dataMaxPrice] as const);
    if (
        (livePerNightPrices.length > 0 || storedPrices.length > 0) &&
        (priceRangeSynced === null ||
            priceRangeSynced[0] !== priceBounds[0] ||
            priceRangeSynced[1] !== priceBounds[1])
    ) {
        setPriceRangeSynced(priceBounds);
        setHotelPriceRange([priceBounds[0], priceBounds[1]]);
        setPriceRangeTouched(false);
    }
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

    // Client refinements apply to the live base list too; date/price/sort are
    // server-owned and already applied by the search.
    const filteredHotels = baseList.filter(clientFilterMatches);

    // In browse mode (no live prices yet) the price slider filters the stored
    // per-night prices client-side; once live results are shown the provider
    // search already applied the price range, so skip it here.
    const matchesBrowsePrice = (hotel: HotelCard): boolean => {
        // With the slider untouched every hotel stays visible; once the user
        // actually filters by price, a hotel with no price must not silently
        // match the range.
        if (!priceFilterActive) return true;
        const price = typeof hotel.price === 'number' ? hotel.price : null;
        if (price === null) return false;
        return price >= hotelPriceRange[0] && price <= hotelPriceRange[1];
    };
    const displayedHotels = liveLoaded
        ? filteredHotels
        : filteredHotels.filter(matchesBrowsePrice);

    // The server returns a fully-sorted live list; in browse mode (no live
    // prices yet) apply the chosen sort client-side so the control works.
    const sortedHotels = useMemo(() => {
        const list = [...displayedHotels];
        if (liveLoaded) {
            return list;
        }

        const priceOf = (hotel: HotelCard) =>
            typeof hotel.price === 'number' ? hotel.price : null;

        const byPrice = (a: HotelCard, b: HotelCard, direction: 1 | -1) => {
            const pa = priceOf(a);
            const pb = priceOf(b);
            if (pa === null && pb === null) return 0;
            if (pa === null) return 1;
            if (pb === null) return -1;
            return direction * (pb - pa);
        };

        if (sort === 'price_desc') {
            return list.sort((a, b) => byPrice(a, b, 1));
        }

        if (sort === 'stars_desc') {
            return list.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
        }

        return list.sort((a, b) => byPrice(a, b, -1));
    }, [displayedHotels, sort, liveLoaded]);

    // The shared date picker is always bounded to the earliest day any
    // displayed hotel is available from (and never allows a same-day
    // check-in, which the provider cannot book), so users can't pick a
    // window before any hotel can be booked.
    const pickerMinDate = useMemo(
        () =>
            earliestCheckIn(displayedHotels.map((h) => h.first_available_at)),
        [displayedHotels],
    );

    // Preserve the current search context into each hotel detail link so the
    // detail page can pre-fill dates/occupancy and auto-run availability.
    const detailLinkParams = useMemo(() => {
        const params = new URLSearchParams();
        const checkIn = toLocalISODate(dateRange?.from);
        const checkOut = toLocalISODate(dateRange?.to);
        if (checkIn) {
            params.set('from', checkIn);
        }
        if (checkOut) {
            params.set('to', checkOut);
        }
        params.set('guests', String(occupancy.adults));
        if (occupancy.childAges.length > 0) {
            params.set('children', occupancy.childAges.join(','));
        }
        return params.toString();
    }, [dateRange, occupancy.adults, occupancy.childAges]);

    const handlePriceChange = (range: [number, number]) => {
        setHotelPriceRange(range);
        setPriceRangeTouched(true);
    };

    const handleClearAll = () => {
        setSearchQuery('');
        setCategoryTypeFilters({});
        setHotelPriceRange([priceBounds[0], priceBounds[1]]);
        setPriceRangeTouched(false);
        setDateRange(undefined);
        setOccupancy({ adults: 2, childAges: [] });
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
                        resultCount={displayedHotels.length}
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
                        <div className="md:hidden">
                            <Sheet
                                open={showMobileFilter}
                                onOpenChange={setShowMobileFilter}
                            >
                                <SheetTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        aria-label={t('hotels.filtersButton')}
                                        className="h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl border-border/70 bg-background/80 px-4 text-xs sm:text-sm shadow-sm"
                                    >
                                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                                        {t('hotels.filtersButton')}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side={isRtl ? 'left' : 'right'}
                                    className="overflow-y-auto"
                                >
                                    <SheetHeader className="mb-6 text-left">
                                        <SheetTitle>
                                            {t('hotels.filters')}
                                        </SheetTitle>
                                        <SheetDescription className="sr-only">
                                            {t('hotels.filters')}
                                        </SheetDescription>
                                    </SheetHeader>
                                    <HotelFilters
                                        hotels={hotels}
                                        lang={lang}
                                        priceRange={hotelPriceRange}
                                        onPriceChange={handlePriceChange}
                                        maxPrice={priceBounds[1]}
                                        minPrice={priceBounds[0]}
                                        liveMode={liveLoaded}
                                        hasPriceData={hasPriceData}
                                        categoryTypes={categoryTypes}
                                        categoryTypeFilters={categoryTypeFilters}
                                        onCategoryTypeChange={(typeKey, values) =>
                                            setCategoryTypeFilters((prev) => ({ ...prev, [typeKey]: values }))
                                        }
                                        occupancy={occupancy}
                                        onOccupancyChange={setOccupancy}
                                    />
                                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClearAll}
                                        >
                                            {t('common.clearFilters')}
                                        </Button>
                                        <SheetClose asChild>
                                            <Button type="button">
                                                {t('hotels.done')}
                                            </Button>
                                        </SheetClose>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            fromDate={pickerMinDate}
                        />
                        <OccupancyPicker
                            value={occupancy}
                            onChange={setOccupancy}
                        />
                        {hasPriceData && (
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
                        )}
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
                            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-3xl border border-border bg-card p-6">
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
                                    onPriceChange={handlePriceChange}
                                    maxPrice={priceBounds[1]}
                                    minPrice={priceBounds[0]}
                                    liveMode={liveLoaded}
                                    hasPriceData={hasPriceData}
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
                            {hasDates && liveQuery !== undefined && (liveResult === undefined || liveFetching) && (
                                <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    {t('hotels.checkingAvailability')}
                                </div>
                            )}
                            {priceLoading ? (
                                <div
                                    data-testid="hotel-skeletons"
                                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                                >
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <HotelCardSkeleton key={index} />
                                    ))}
                                </div>
                            ) : displayedHotels.length === 0 ? (
                                <RequestThingEmptyState
                                    variant={
                                        hotels.length === 0
                                            ? 'empty'
                                            : 'no-results'
                                    }
                                />
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {sortedHotels.map((hotel, index) => {
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
                                                    to={`/hotels/${hotel.slug}${
                                                        detailLinkParams
                                                            ? `?${detailLinkParams}`
                                                            : ''
                                                    }`}
                                                    className="group block transform-gpu overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                                >
                                                    <div className="relative h-56 overflow-hidden">
                                                        {hotel.image ? (
                                                            <img
                                                                src={hotel.image}
                                                                alt={localizeText(
                                                                    hotel.name,
                                                                    lang,
                                                                )}
                                                                className="h-full w-full transform-gpu object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-muted">
                                                                <Building2 className="h-12 w-12 text-muted-foreground" />
                                                            </div>
                                                        )}

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
                                                                (() => {
                                                                    const promo = promoPrice(hotel.price_total, hotel.promotion?.rate);
                                                                    return (
                                                                        <div className="flex flex-col items-end gap-0.5 text-right">
                                                                            <span>
                                                                                {(promo ? promo.discounted : hotel.price_total)?.toLocaleString()}{' '}
                                                                                {hotel.currency ?? 'TND'}
                                                                                {hotel.nights
                                                                                    ? ` · ${hotel.nights} ${t('hotelDetail.nightsLabel')}`
                                                                                    : ''}
                                                                            </span>
                                                                            {promo && (
                                                                                <span className="text-[10px] font-medium text-muted-foreground line-through">
                                                                                    {promo.original.toLocaleString()}{' '}
                                                                                    {hotel.currency ?? 'TND'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : (
                                                                t('hotelDetail.checkAvailability')
                                                            )}
                                                        </div>

                                                        {liveLoaded && (
                                                            <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between gap-2">
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

                                                        {liveLoaded ? (
                                                            (hotel.promotion
                                                                ?.rate ||
                                                                hotel.free_child
                                                                    ?.length ||
                                                                hotel.recommended) && (
                                                                <div className="mb-3 flex flex-wrap gap-2">
                                                                    {hotel.promotion?.rate && (
                                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                                                            {t('hotelDetail.promo')}{' '}
                                                                            {hotel.promotion.title}
                                                                            {formatPromoRate(hotel.promotion.rate) && (
                                                                                <>
                                                                                    {' · '}
                                                                                    {formatPromoRate(hotel.promotion.rate)}
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {hotel.free_child?.length ? (
                                                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                            {t('hotelDetail.freeChild')}
                                                                        </span>
                                                                    ) : null}
                                                                    {hotel.recommended ? (
                                                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                                            {t('hotelDetail.recommended')}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            )
                                                        ) : (hotel.tarifs_promo ||
                                                              hotel.enfant_gratuit ||
                                                              hotel.htel_recommande) ? (
                                                            <div className="mb-3 flex flex-wrap gap-2">
                                                                {hotel.tarifs_promo && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                                                        {t('hotelDetail.promo')}
                                                                    </span>
                                                                )}
                                                                {hotel.enfant_gratuit && (
                                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                        {t('hotelDetail.freeChild')}
                                                                    </span>
                                                                )}
                                                                {hotel.htel_recommande && (
                                                                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                                        {t('hotelDetail.recommended')}
                                                                    </span>
                                                                )}
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
