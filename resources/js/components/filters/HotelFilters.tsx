import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Slider } from '@/components/ui/slider';
import { FilterRenderer } from './FilterRenderer';
import type { HotelItem } from '@/types/public/hotel.types';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface HotelFiltersProps {
    hotels: HotelItem[];
    lang: string;
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    maxPrice: number;
    minPrice: number;
    categoryTypes: PublicCategoryType[];
    categoryTypeFilters: Record<string, string[]>;
    onCategoryTypeChange: (typeKey: string, values: string[]) => void;
    guests: number;
    onGuestsChange: (value: number) => void;
}

export function HotelFilters({
    hotels,
    lang,
    priceRange,
    onPriceChange,
    maxPrice,
    minPrice,
    categoryTypes,
    categoryTypeFilters,
    onCategoryTypeChange,
    guests,
    onGuestsChange,
}: HotelFiltersProps) {
    // Get unique countries from hotels
    const availableCountries = useMemo(() => {
        const countriesMap = new Map<string, { count: number; label: { en: string; fr: string; ar: string } }>();
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
        return Array.from(countriesMap.entries()).sort((a, b) => b[1].count - a[1].count);
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

    const STARS_LABELS: Record<number, { en: string; fr: string; ar: string }> = {
        1: { en: '1 Star', fr: '★ (1 étoile)', ar: '1 نجمة' },
        2: { en: '2 Stars', fr: '★★ (2 étoiles)', ar: '2 نجمة' },
        3: { en: '3 Stars', fr: '★★★ (3 étoiles)', ar: '3 نجوم' },
        4: { en: '4 Stars', fr: '★★★★ (4 étoiles)', ar: '4 نجوم' },
        5: { en: '5 Stars', fr: '★★★★★ (5 étoiles)', ar: '5 نجوم' },
    };

    return (
        <div className="space-y-0">
            {/* Country Filter */}
            <div>
                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 sm:mb-3">
                    {lang === 'fr' ? 'Pays' : lang === 'ar' ? 'البلد' : 'Country'}
                </h3>
                <div className="space-y-0.5 sm:space-y-1">
                    {availableCountries.map(([countryKey, { count, label }]) => {
                        const key = `country_${countryKey}`;
                        const isActive = categoryTypeFilters[`dynamic_${key}`]?.length > 0;
                        return (
                            <label
                                key={key}
                                className={`flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors ${
                                    isActive
                                        ? 'bg-primary/10 border border-primary/30'
                                        : 'hover:bg-muted/50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded border-2 transition-colors ${
                                        isActive
                                            ? 'border-primary bg-primary'
                                            : 'border-muted-foreground/30 bg-background'
                                    }`}>
                                        {isActive && (
                                            <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => {
                                            const currentValues = categoryTypeFilters[`dynamic_${key}`] || [];
                                            const newValues = e.target.checked
                                                ? [...currentValues, countryKey]
                                                : currentValues.filter((v) => v !== countryKey);
                                            onCategoryTypeChange(`dynamic_${key}`, newValues);
                                        }}
                                        className="sr-only"
                                    />
                                    <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {label[lang] || label.en}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    ({count})
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Guests Field */}
            <div className="border-t border-border my-3 sm:my-4 py-3 sm:py-4">
                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 sm:mb-3">
                    {lang === 'fr' ? 'Voyageurs' : lang === 'ar' ? 'الضيوف' : 'Guests'}
                </h3>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                        className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-background text-base sm:text-lg font-bold text-foreground hover:bg-muted transition-colors"
                    >
                        -
                    </button>
                    <span className="text-base sm:text-lg font-medium text-foreground min-w-[1.5rem] sm:min-w-[2rem] text-center">
                        {guests}
                    </span>
                    <button
                        type="button"
                        onClick={() => onGuestsChange(guests + 1)}
                        className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-background text-base sm:text-lg font-bold text-foreground hover:bg-muted transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Price Slider */}
            <div className="border-t border-border my-3 sm:my-4 py-3 sm:py-4">
                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 sm:mb-3">
                    {lang === 'fr' ? 'Budget' : lang === 'ar' ? 'الميزانية' : 'Budget'}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                    <Slider
                        value={priceRange}
                        onValueChange={(value) => onPriceChange(value as [number, number])}
                        min={minPrice}
                        max={maxPrice}
                        step={1}
                    />
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>{minPrice} DT</span>
                        <span className="font-medium text-foreground">
                            {priceRange[0]} DT - {priceRange[1]} DT
                        </span>
                        <span>{maxPrice} DT</span>
                    </div>
                </div>
            </div>

            {/* Stars Filter */}
            <div className="border-t border-border my-3 sm:my-4 py-3 sm:py-4">
                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 sm:mb-3">
                    {lang === 'fr' ? 'Étoiles' : lang === 'ar' ? 'نجوم' : 'Stars'}
                </h3>
                <div className="space-y-0.5 sm:space-y-1">
                    {availableStars.map((star) => {
                        const key = `star_${star}`;
                        const isActive = categoryTypeFilters[`dynamic_${key}`]?.length > 0;
                        const count = starCounts[star] || 0;
                        const starLabel = STARS_LABELS[star] || { en: `${star} Stars`, fr: `${star} étoiles`, ar: `${star} نجوم` };
                        return (
                            <label
                                key={key}
                                className={`flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors ${
                                    isActive
                                        ? 'bg-primary/10 border border-primary/30'
                                        : 'hover:bg-muted/50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded border-2 transition-colors ${
                                        isActive
                                            ? 'border-primary bg-primary'
                                            : 'border-muted-foreground/30 bg-background'
                                    }`}>
                                        {isActive && (
                                            <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => {
                                            const currentValues = categoryTypeFilters[`dynamic_${key}`] || [];
                                            const newValues = e.target.checked
                                                ? [...currentValues, String(star)]
                                                : currentValues.filter((v) => v !== String(star));
                                            onCategoryTypeChange(`dynamic_${key}`, newValues);
                                        }}
                                        className="sr-only"
                                    />
                                    <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {starLabel[lang] || starLabel.en}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    ({count})
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Category Types from API */}
            {categoryTypes.map((catType) => (
                <div key={catType.key} className="border-t border-border my-3 sm:my-4 py-3 sm:py-4">
                    <FilterRenderer
                        categoryType={catType}
                        selectedValues={categoryTypeFilters[catType.key] ?? []}
                        onChange={(values) => onCategoryTypeChange(catType.key, values)}
                        lang={lang}
                        items={hotels}
                    />
                </div>
            ))}
        </div>
    );
}