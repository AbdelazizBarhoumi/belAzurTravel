import { useMemo } from 'react';
import {
    OccupancyPicker,
    type Occupancy,
} from '@/components/ui/OccupancyPicker';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { PROVIDER_CATEGORY_MAP } from '@/data/hotelFilters';
import type { PublicCategoryType } from '@/hooks/usePublicData';
import { getStaticFilterGroup } from '@/lib/nav-static-filters';
import type { HotelItem } from '@/types/public/hotel.types';
import { CityFilter } from './CityFilter';
import { FilterRenderer } from './FilterRenderer';

// Derived from the shared static filters config — computed once at module load
const STARS_LABELS_FROM_CONFIG: Record<
    number,
    { en: string; fr: string; ar: string }
> = (() => {
    const group = getStaticFilterGroup('hotels', 'stars');
    if (!group) return {};
    const labels: Record<number, { en: string; fr: string; ar: string }> = {};
    for (const opt of group.options) {
        const num = parseInt(opt.key.replace('star_', ''), 10);
        if (!isNaN(num)) {
            labels[num] = opt.label;
        }
    }
    return labels;
})();

interface HotelFiltersProps {
    hotels: HotelItem[];
    lang: string;
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    maxPrice: number;
    minPrice: number;
    /** When true (live results shown) the price range applies to the whole
     *  stay; otherwise it filters stored per-night prices. */
    liveMode?: boolean;
    /** When false (no prices retrieved) the Budget slider is hidden. */
    hasPriceData?: boolean;
    categoryTypes: PublicCategoryType[];
    categoryTypeFilters: Record<string, string[]>;
    onCategoryTypeChange: (typeKey: string, values: string[]) => void;
    occupancy: Occupancy;
    onOccupancyChange: (occupancy: Occupancy) => void;
}

export function HotelFilters({
    hotels,
    lang,
    priceRange,
    onPriceChange,
    maxPrice,
    minPrice,
    liveMode = false,
    hasPriceData = true,
    categoryTypes,
    categoryTypeFilters,
    onCategoryTypeChange,
    occupancy,
    onOccupancyChange,
}: HotelFiltersProps) {
    const { t } = useLanguage();
    // Get unique countries from hotels
    const availableCountries = useMemo(() => {
        const countriesMap = new Map<
            string,
            { count: number; label: { en: string; fr: string; ar: string } }
        >();
        for (const hotel of hotels) {
            const countryObj = hotel.country;
            if (countryObj && typeof countryObj === 'object') {
                const key = countryObj.en || '';
                if (key) {
                    const existing = countriesMap.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        countriesMap.set(key, { count: 1, label: countryObj });
                    }
                }
            }
        }
        return Array.from(countriesMap.entries()).sort(
            (a, b) => b[1].count - a[1].count,
        );
    }, [hotels]);

    // Get unique cities from hotels
    const availableCities = useMemo(() => {
        const citiesMap = new Map<
            string,
            { count: number; label: { en: string; fr: string; ar: string } }
        >();
        for (const hotel of hotels) {
            const cityObj = hotel.city;
            if (cityObj && typeof cityObj === 'object') {
                const key = cityObj.en || '';
                if (key) {
                    const existing = citiesMap.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        citiesMap.set(key, { count: 1, label: cityObj });
                    }
                }
            }
        }
        return Array.from(citiesMap.entries()).sort(
            (a, b) => b[1].count - a[1].count,
        );
    }, [hotels]);

    // Get unique stars from hotels
    const availableStars = useMemo(() => {
        const starsSet = new Set(hotels.map((h) => h.stars).filter(Boolean));
        return Array.from(starsSet).sort((a, b) => b - a);
    }, [hotels]);

    const starCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const star of availableStars) {
            counts[star] = hotels.filter((h) => h.stars === star).length;
        }
        return counts;
    }, [hotels, availableStars]);

    // Compute available non-starred categories from hotels where stars=0.
    // Uses the hotel.category field (provider title) and maps through
    // PROVIDER_CATEGORY_MAP to get stable keys and translated labels.
    const availableCategories = useMemo(() => {
        const catMap = new Map<
            string,
            { key: string; label: { en: string; fr: string; ar: string }; count: number }
        >();
        for (const hotel of hotels) {
            if (hotel.stars !== 0) continue;
            const catObj = hotel.category;
            if (!catObj || typeof catObj !== 'object') continue;
            // The provider stores the same French title in all locales
            const rawTitle = catObj.fr || catObj.en || '';
            if (!rawTitle) continue;
            const mapping = PROVIDER_CATEGORY_MAP[rawTitle];
            if (!mapping) continue;
            const existing = catMap.get(mapping.key);
            if (existing) {
                existing.count++;
            } else {
                catMap.set(mapping.key, {
                    key: mapping.key,
                    label: {
                        en: catObj.en || rawTitle,
                        fr: catObj.fr || rawTitle,
                        ar: catObj.ar || rawTitle,
                    },
                    count: 1,
                });
            }
        }
        return Array.from(catMap.values());
    }, [hotels]);

    const STARS_LABELS = STARS_LABELS_FROM_CONFIG;

    return (
        <div className="space-y-0">
            {/* Country Filter */}
            <div>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
                    {lang === 'fr'
                        ? 'Pays'
                        : lang === 'ar'
                          ? 'البلد'
                          : 'Country'}
                </h3>
                <div className="space-y-0.5 sm:space-y-1">
                    {availableCountries.map(
                        ([countryKey, { count, label }]) => {
                            const key = `country_${countryKey}`;
                            const isActive =
                                categoryTypeFilters[`dynamic_${key}`]?.length >
                                0;
                            return (
                                <label
                                    key={key}
                                    className={`flex cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 py-1.5 transition-colors sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 ${
                                        isActive
                                            ? 'border border-primary/30 bg-primary/10'
                                            : 'border border-transparent hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div
                                            className={`flex h-3.5 w-3.5 items-center justify-center rounded border-2 transition-colors sm:h-4 sm:w-4 ${
                                                isActive
                                                    ? 'border-primary bg-primary'
                                                    : 'border-muted-foreground/30 bg-background'
                                            }`}
                                        >
                                            {isActive && (
                                                <svg
                                                    className="h-2.5 w-2.5 text-primary-foreground sm:h-3 sm:w-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={3}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) => {
                                                const currentValues =
                                                    categoryTypeFilters[
                                                        `dynamic_${key}`
                                                    ] || [];
                                                const newValues = e.target
                                                    .checked
                                                    ? [
                                                          ...currentValues,
                                                          countryKey,
                                                      ]
                                                    : currentValues.filter(
                                                          (v) =>
                                                              v !== countryKey,
                                                      );
                                                onCategoryTypeChange(
                                                    `dynamic_${key}`,
                                                    newValues,
                                                );
                                            }}
                                            className="sr-only"
                                        />
                                        <span
                                            className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                                        >
                                            {label[lang] || label.en}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        ({count})
                                    </span>
                                </label>
                            );
                        },
                    )}
                </div>
            </div>

            {/* City Filter */}
            {availableCities.length > 0 && (
                <div>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
                        {lang === 'fr'
                            ? 'Ville'
                            : lang === 'ar'
                              ? 'المدينة'
                              : 'City'}
                    </h3>
                    <CityFilter
                        cities={availableCities.map(
                            ([key, { count, label }]) => ({
                                key,
                                count,
                                label,
                            }),
                        )}
                        selected={categoryTypeFilters['dynamic_city'] ?? []}
                        onChange={(values) =>
                            onCategoryTypeChange('dynamic_city', values)
                        }
                        lang={lang}
                    />
                </div>
            )}

            {/* Occupancy Field */}
            <div className="my-3 border-t border-border py-3 sm:my-4 sm:py-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
                    {t('hotels.occupancy')}
                </h3>
                <OccupancyPicker
                    value={occupancy}
                    onChange={onOccupancyChange}
                    compact
                    className="w-full"
                />
            </div>

            {/* Price Slider */}
            {hasPriceData && (
                <div className="my-3 border-t border-border py-3 sm:my-4 sm:py-4">
                    <div className="mb-2 flex items-baseline justify-between gap-2 sm:mb-3">
                        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                            {lang === 'fr'
                                ? 'Budget'
                                : lang === 'ar'
                                  ? 'الميزانية'
                                  : 'Budget'}
                        </h3>
                        <span className="text-[9px] text-muted-foreground/70 sm:text-[10px]">
                            {liveMode
                                ? t('hotels.priceUnitLive')
                                : t('hotels.priceUnitBrowse')}
                        </span>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        <Slider
                            value={priceRange}
                            onValueChange={(value) =>
                                onPriceChange(value as [number, number])
                            }
                            min={minPrice}
                            max={maxPrice}
                            step={1}
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground sm:text-[10px]">
                            <span>{minPrice} DT</span>
                            <span className="font-medium text-foreground">
                                {priceRange[0]} DT - {priceRange[1]} DT
                            </span>
                            <span>{maxPrice} DT</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stars & Accommodation Type Filter */}
            <div className="my-3 border-t border-border py-3 sm:my-4 sm:py-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
                    {t('hotels.filterByCategory')}
                </h3>
                <div className="space-y-0.5 sm:space-y-1">
                    {availableStars.map((star) => {
                        const key = `star_${star}`;
                        const isActive =
                            categoryTypeFilters[`dynamic_${key}`]?.length > 0;
                        const count = starCounts[star] || 0;
                        const starLabel = STARS_LABELS[star] || {
                            en: `${star} Stars`,
                            fr: `${star} étoiles`,
                            ar: `${star} نجوم`,
                        };
                        return (
                            <label
                                key={key}
                                className={`flex cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 py-1.5 transition-colors sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 ${
                                    isActive
                                        ? 'border border-primary/30 bg-primary/10'
                                        : 'border border-transparent hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div
                                        className={`flex h-3.5 w-3.5 items-center justify-center rounded border-2 transition-colors sm:h-4 sm:w-4 ${
                                            isActive
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground/30 bg-background'
                                        }`}
                                    >
                                        {isActive && (
                                            <svg
                                                className="h-2.5 w-2.5 text-primary-foreground sm:h-3 sm:w-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => {
                                            const currentValues =
                                                categoryTypeFilters[
                                                    `dynamic_${key}`
                                                ] || [];
                                            const newValues = e.target.checked
                                                ? [
                                                      ...currentValues,
                                                      String(star),
                                                  ]
                                                : currentValues.filter(
                                                      (v) => v !== String(star),
                                                  );
                                            onCategoryTypeChange(
                                                `dynamic_${key}`,
                                                newValues,
                                            );
                                        }}
                                        className="sr-only"
                                    />
                                    <span
                                        className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        {starLabel[lang] || starLabel.en}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    ({count})
                                </span>
                            </label>
                        );
                    })}
                    {availableCategories.map((cat) => {
                        const filterKey = `dynamic_cat_${cat.key}`;
                        const isActive =
                            categoryTypeFilters[filterKey]?.length > 0;
                        return (
                            <label
                                key={cat.key}
                                className={`flex cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 py-1.5 transition-colors sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 ${
                                    isActive
                                        ? 'border border-primary/30 bg-primary/10'
                                        : 'border border-transparent hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div
                                        className={`flex h-3.5 w-3.5 items-center justify-center rounded border-2 transition-colors sm:h-4 sm:w-4 ${
                                            isActive
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground/30 bg-background'
                                        }`}
                                    >
                                        {isActive && (
                                            <svg
                                                className="h-2.5 w-2.5 text-primary-foreground sm:h-3 sm:w-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => {
                                            const currentValues =
                                                categoryTypeFilters[
                                                    filterKey
                                                ] || [];
                                            const newValues = e.target.checked
                                                ? [...currentValues, cat.key]
                                                : currentValues.filter(
                                                      (v) => v !== cat.key,
                                                  );
                                            onCategoryTypeChange(
                                                filterKey,
                                                newValues,
                                            );
                                        }}
                                        className="sr-only"
                                    />
                                    <span
                                        className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        {cat.label[lang] || cat.label.en}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    ({cat.count})
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Category Types from API */}
            {categoryTypes.map((catType) => (
                <div
                    key={catType.key}
                    className="my-3 border-t border-border py-3 sm:my-4 sm:py-4"
                >
                    <FilterRenderer
                        categoryType={catType}
                        selectedValues={categoryTypeFilters[catType.key] ?? []}
                        onChange={(values) =>
                            onCategoryTypeChange(catType.key, values)
                        }
                        lang={lang}
                        items={hotels}
                    />
                </div>
            ))}
        </div>
    );
}
