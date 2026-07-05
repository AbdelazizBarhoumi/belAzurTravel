import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HOTEL_FILTER_GROUPS, HOTEL_FILTER_KEYS, STARS_LABELS } from '@/data/hotelFilters';
import { Slider } from '@/components/ui/slider';
import type { HotelItem } from '@/types/public/hotel.types';
import { localizeText } from '@/data';

interface HotelFiltersProps {
    selectedFilters: Record<string, boolean>;
    priceRange: [number, number];
    onFilterChange: (key: string, value: boolean) => void;
    onPriceChange: (range: [number, number]) => void;
    maxPrice: number;
    minPrice: number;
    hotels: HotelItem[];
    lang: string;
}

export function HotelFilters({
    selectedFilters,
    priceRange,
    onFilterChange,
    onPriceChange,
    maxPrice,
    minPrice,
    hotels,
    lang,
}: HotelFiltersProps) {
    // Calculate counts for each filter option
    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const key of HOTEL_FILTER_KEYS) {
            counts[key] = hotels.filter((hotel) => (hotel as any)[key] === true).length;
        }
        return counts;
    }, [hotels]);

    // Get unique stars from hotels
    const availableStars = useMemo(() => {
        const starsSet = new Set(hotels.map((h) => h.stars).filter(Boolean));
        return Array.from(starsSet).sort((a, b) => b - a);
    }, [hotels]);

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

    // Count hotels per star
    const starCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const star of availableStars) {
            counts[star] = hotels.filter((h) => h.stars === star).length;
        }
        return counts;
    }, [hotels, availableStars]);

    return (
        <div className="space-y-0">
            {HOTEL_FILTER_GROUPS.map((group, groupIndex) => (
                <div key={group.key}>
                    {/* Separator line between groups */}
                    {groupIndex > 0 && (
                        <div className="border-t border-border my-4" />
                    )}

                    {/* Group title */}
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        {group.label[lang] || group.label.en}
                    </h3>

                    {/* Price slider */}
                    {group.type === 'price' && (
                        <div className="space-y-3">
                            <Slider
                                value={priceRange}
                                onValueChange={(value) => onPriceChange(value as [number, number])}
                                min={minPrice}
                                max={maxPrice}
                                step={1}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{minPrice} DT</span>
                                <span className="font-medium text-foreground">
                                    {priceRange[0]} DT - {priceRange[1]} DT
                                </span>
                                <span>{maxPrice} DT</span>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Stars filter */}
                    {group.key === 'categorie' && group.dynamic && (
                        <div className="space-y-1">
                            {availableStars.map((star) => {
                                const key = `star_${star}`;
                                const isActive = selectedFilters[key] || false;
                                const count = starCounts[star] || 0;
                                const starLabel = STARS_LABELS[star] || { en: `${star} Stars`, fr: `${star} étoiles`, ar: `${star} نجوم` };
                                return (
                                    <label
                                        key={key}
                                        className={`flex items-center justify-between gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                                            isActive
                                                ? 'bg-primary/10 border border-primary/30'
                                                : 'hover:bg-muted/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                                                isActive
                                                    ? 'border-primary bg-primary'
                                                    : 'border-muted-foreground/30 bg-background'
                                            }`}>
                                                {isActive && (
                                                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={(e) => onFilterChange(key, e.target.checked)}
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
                    )}

                    {/* Dynamic Countries filter */}
                    {group.key === 'pays' && group.dynamic && (
                        <div className="space-y-1">
                            {availableCountries.map(([countryKey, { count, label }]) => {
                                const key = `country_${countryKey}`;
                                const isActive = selectedFilters[key] || false;
                                return (
                                    <label
                                        key={key}
                                        className={`flex items-center justify-between gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                                            isActive
                                                ? 'bg-primary/10 border border-primary/30'
                                                : 'hover:bg-muted/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                                                isActive
                                                    ? 'border-primary bg-primary'
                                                    : 'border-muted-foreground/30 bg-background'
                                            }`}>
                                                {isActive && (
                                                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={(e) => onFilterChange(key, e.target.checked)}
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
                    )}

                    {/* Static Checkbox options */}
                    {group.type === 'checkbox' && !group.dynamic && group.options && (
                        <div className="space-y-1">
                            {group.options.map((option) => {
                                const isActive = selectedFilters[option.key] || false;
                                const count = filterCounts[option.key] || 0;
                                return (
                                    <label
                                        key={option.key}
                                        className={`flex items-center justify-between gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                                            isActive
                                                ? 'bg-primary/10 border border-primary/30'
                                                : 'hover:bg-muted/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                                                isActive
                                                    ? 'border-primary bg-primary'
                                                    : 'border-muted-foreground/30 bg-background'
                                            }`}>
                                                {isActive && (
                                                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={(e) => onFilterChange(option.key, e.target.checked)}
                                                className="sr-only"
                                            />
                                            <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                {option.label[lang] || option.label.en}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            ({count})
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}