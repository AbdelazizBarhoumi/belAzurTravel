import { motion } from 'framer-motion';
import { Wifi, Car, Coffee, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HotelFilters } from '@/components/filters/HotelFilters';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { DatePicker } from '@/components/ui/DatePicker';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { StarRating } from '@/components/ui/StarRating';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useCountries, useCities } from '@/hooks/useCountries';
import { useHotels, useCategories } from '@/hooks/usePublicData';
import { HOTEL_FILTER_KEYS } from '@/data/hotelFilters';

import { matchesFilterValue, matchesSearchText } from '@/lib/listFilters';

const AMENITY_ICONS: Record<string, LucideIcon> = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
};

export default function Hotels() {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    // Accept landing widget params as fallback (destination -> q)
    const initialSearch = params.get('q') || params.get('destination') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || '';
    const initialCountry = params.get('country') || '';
    const initialCity = params.get('city') || '';
    const initialGuests = Number(params.get('guests') || 2);
    const initialFromDate = params.get('from') || '';
    const initialToDate = params.get('to') || '';
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    // referenced to satisfy linter until mobile filter UI is implemented
    void showMobileFilter;
    void setShowMobileFilter;
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [selectedTags, setSelectedTags] = useState<string[]>(
        initialCategory ? [initialCategory] : [],
    );

    // Use a simple string dependency for URLSearchParams to satisfy linting
    // Initialize star filter from URL parameter or mapped propertyClass (e.g. "4-star")
    const initialStars = (() => {
        const starsParam = params.get('stars');
        const propertyClass =
            params.get('propertyClass') || params.get('propertyclass');

        let fromPropertyClass: number | null = null;
        if (propertyClass) {
            const m = propertyClass.match(/(\d+)/);
            if (m) fromPropertyClass = parseInt(m[1], 10);
        }

        const stars =
            starsParam ??
            (fromPropertyClass ? String(fromPropertyClass) : null);
        if (stars) {
            const starsNum = parseInt(stars, 10);
            if (starsNum >= 1 && starsNum <= 5) {
                return [starsNum];
            }
        }
        return [];
    })();

    const [selectedStars, setSelectedStars] = useState<number[]>(initialStars);
    // Honor landing roomType param as a tag-like filter when present
    const initialRoomType =
        params.get('roomType') || params.get('roomtype') || 'any';
    const [roomType, _setRoomType] = useState<string>(initialRoomType);
    const [guests, setGuests] = useState(
        Number.isFinite(initialGuests) && initialGuests > 0 ? initialGuests : 2,
    );
    const [fromDate, setFromDate] = useState(initialFromDate);
    const [toDate, setToDate] = useState(initialToDate);
    const { data: hotels = [] } = useHotels();
    const { data: dynamicCategories = [] } = useCategories('hotels');

    // Hotel filter state
    const [hotelFilters, setHotelFilters] = useState<Record<string, boolean>>({});
    const [hotelPriceRange, setHotelPriceRange] = useState<[number, number]>([0, 1000]);

    const HOTEL_TAGS = dynamicCategories.map((c) => ({
        id: c.key,
        name: {
            en: c.name.en,
            fr: c.name.fr || c.name.en,
            ar: c.name.ar || c.name.en,
        },
    }));

    const allCountries = useCountries();
    const allCities = useCities(selectedCountry || null);

    const countries = useMemo(() => {
        return allCountries.map((c) => c.name[lang] || c.name.en);
    }, [allCountries, lang]);

    const cities = useMemo(() => {
        return allCities.map((c) => c.name[lang] || c.name.en);
    }, [allCities, lang]);

    const maxPrice =
        hotels.length > 0 ? Math.max(...hotels.map((hotel) => hotel.price)) : 1000;

    const minPrice =
        hotels.length > 0 ? Math.min(...hotels.map((hotel) => hotel.price)) : 0;

    const hasLandingDateOrGuestFilters =
        guests !== 2 || fromDate !== '' || toDate !== '';

    const hasActiveHotelFilters = Object.values(hotelFilters).some((v) => v);
    const filteredHotels =
        searchQuery.trim().length === 0 &&
        selectedTags.length === 0 &&
        selectedStars.length === 0 &&
        (selectedCountry === '' || selectedCountry === 'all') &&
        (selectedCity === '' || selectedCity === 'all') &&
        hotelPriceRange[0] === minPrice &&
        hotelPriceRange[1] === maxPrice &&
        !hasActiveHotelFilters
            ? hotels
            : hotels.filter((hotel) => {
                  const matchesSearch = matchesSearchText(searchQuery, [
                      localizeText(hotel.name, lang),
                      localizeText(hotel.location, lang),
                      localizeText(hotel.country, lang),
                      localizeText(hotel.city, lang),
                      (hotel.tags ?? []).join(' '),
                  ]);
                  const matchesTags =
                      selectedTags.length === 0 ||
                      selectedTags.some((tag) =>
                          matchesFilterValue(tag, hotel.tags ?? []),
                      );
                  const matchesStars =
                      selectedStars.length === 0 ||
                      selectedStars.includes(hotel.stars);
                  const matchesRoomType =
                      !roomType ||
                      roomType === 'any' ||
                      (hotel.tags ?? []).includes(roomType);
                  const matchesCountry =
                      !selectedCountry ||
                      selectedCountry === 'all' ||
                      localizeText(hotel.country, lang) === selectedCountry;
                  const matchesCity =
                      !selectedCity ||
                      selectedCity === 'all' ||
                      localizeText(hotel.city, lang) === selectedCity;
                  const matchesPrice =
                      hotel.price >= hotelPriceRange[0] &&
                      hotel.price <= hotelPriceRange[1];
                  // Check hotel filter fields (OR logic - match any active filter)
                  const activeFilterKeys = HOTEL_FILTER_KEYS.filter(
                      (key) => hotelFilters[key]
                  );
                  const matchesStaticFilters =
                      activeFilterKeys.length === 0 ||
                      activeFilterKeys.some((key) => (hotel as any)[key] === true);
                  // Check dynamic star filters
                  const activeStarFilters = Object.entries(hotelFilters)
                      .filter(([key, val]) => val && key.startsWith('star_'))
                      .map(([key]) => parseInt(key.replace('star_', '')));
                  const matchesStarFilters =
                      activeStarFilters.length === 0 ||
                      activeStarFilters.includes(hotel.stars);
                  // Check dynamic country filters
                  const activeCountryFilters = Object.entries(hotelFilters)
                      .filter(([key, val]) => val && key.startsWith('country_'))
                      .map(([key]) => key.replace('country_', ''));
                  const hotelCountry = hotel.country && typeof hotel.country === 'object' ? hotel.country.en : '';
                  const matchesCountryFilters =
                      activeCountryFilters.length === 0 ||
                      activeCountryFilters.includes(hotelCountry);
                  return (
                      matchesSearch &&
                      matchesTags &&
                      matchesRoomType &&
                      matchesCountry &&
                      matchesCity &&
                      matchesPrice &&
                      matchesStaticFilters &&
                      matchesStarFilters &&
                      matchesCountryFilters
                  );
              });

    const handleTagToggle = (tagId: string) => {
        setSelectedTags((current) =>
            current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId],
        );
    };

    const handleStarToggle = (stars: number) => {
        setSelectedStars((current) =>
            current.includes(stars)
                ? current.filter((s) => s !== stars)
                : [...current, stars],
        );
    };

    const handleClearAll = () => {
        setSearchQuery('');
        setSelectedTags([]);
        setSelectedStars([]);
        setSelectedCountry('all');
        setSelectedCity('all');
        setHotelFilters({});
        setHotelPriceRange([minPrice, maxPrice]);
    };

    return (
        <div key={params.toString()} className="min-h-screen bg-background">
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
                    </motion.header>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredHotels.length}
                        hasActiveFilters={
                            searchQuery.trim().length > 0 ||
                            selectedTags.length > 0 ||
                            selectedStars.length > 0 ||
                            (selectedCountry !== '' && selectedCountry !== 'all') ||
                            (selectedCity !== '' && selectedCity !== 'all') ||
                            hasLandingDateOrGuestFilters ||
                            Object.values(hotelFilters).some((v) => v)
                        }
                        onClearFilters={handleClearAll}
                        searchPlaceholder={t('common.search')}
                        className="mb-8"
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
                                    {t('search.fields.guests')}
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={guests}
                                    onChange={(event) =>
                                        setGuests(
                                            Math.max(
                                                1,
                                                Number(event.target.value) || 1,
                                            ),
                                        )
                                    }
                                    className="h-12 rounded-2xl border border-border/70 bg-background/90 px-3 text-sm shadow-sm"
                                    aria-label={t('search.fields.guests')}
                                />
                            </label>
                        </div>
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
                                    {Object.values(hotelFilters).some((v) => v) && (
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
                                    selectedFilters={hotelFilters}
                                    priceRange={hotelPriceRange}
                                    onFilterChange={(key, value) =>
                                        setHotelFilters((prev) => ({ ...prev, [key]: value }))
                                    }
                                    onPriceChange={setHotelPriceRange}
                                    maxPrice={maxPrice}
                                    minPrice={minPrice}
                                    hotels={hotels}
                                    lang={lang}
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
                                                        {hotel.price} TND
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

                                                    <div className="mb-4">
                                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                                                            {hotel.tags.map(
                                                                (tagId) => {
                                                                    const tag =
                                                                        HOTEL_TAGS.find(
                                                                            (
                                                                                item,
                                                                            ) =>
                                                                                item.id ===
                                                                                tagId,
                                                                        );
                                                                    if (!tag)
                                                                        return null;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                tagId
                                                                            }
                                                                            className="flex items-center justify-center rounded-lg bg-muted px-2 py-1"
                                                                        >
                                                                            <span className="text-center text-xs font-medium text-muted-foreground">
                                                                                {
                                                                                    tag
                                                                                        .name[
                                                                                        lang
                                                                                    ]
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex gap-2">
                                                            {hotel.amenities.map(
                                                                (amenity) => {
                                                                    const Icon =
                                                                        AMENITY_ICONS[
                                                                            amenity
                                                                        ];
                                                                    if (!Icon)
                                                                        return null;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                amenity
                                                                            }
                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"
                                                                        >
                                                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>

                                                        <span className="text-sm font-semibold text-primary">
                                                            {t(
                                                                'common.viewAll',
                                                            )}
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
