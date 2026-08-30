import { useMemo } from 'react';
import type { TravelItem } from '@/api/entities.api';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { localizeText } from '@/data';
import type { PublicCategoryType } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import { CollapsibleSection } from './CollapsibleSection';
import { FilterRenderer } from './FilterRenderer';

interface TravelFiltersProps {
    travels: TravelItem[];
    lang: string;
    categoryTypes: PublicCategoryType[];
    categoryTypeFilters: Record<string, string[]>;
    onCategoryTypeChange: (typeKey: string, values: string[]) => void;
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    maxPrice: number;
    minPrice: number;
    travelers: number;
    onTravelersChange: (value: number) => void;
}

export function TravelFilters({
    travels,
    lang,
    categoryTypes,
    categoryTypeFilters,
    onCategoryTypeChange,
    priceRange,
    onPriceChange,
    maxPrice,
    minPrice,
    travelers,
    onTravelersChange,
}: TravelFiltersProps) {
    const availableCountries = useMemo(() => {
        const countriesMap = new Map<
            string,
            { count: number; label: string }
        >();
        for (const travel of travels) {
            const location = localizeText(travel.location, lang as Lang);
            if (location) {
                const existing = countriesMap.get(location);
                if (existing) {
                    existing.count++;
                } else {
                    countriesMap.set(location, { count: 1, label: location });
                }
            }
        }
        return Array.from(countriesMap.entries()).sort(
            (a, b) => b[1].count - a[1].count,
        );
    }, [travels, lang]);

    return (
        <div className="space-y-0">
            {/* Country Filter - First */}
            <CollapsibleSection
                title={
                    lang === 'fr' ? 'Pays' : lang === 'ar' ? 'البلد' : 'Country'
                }
            >
                <div
                    className={`space-y-0.5 sm:space-y-1 ${availableCountries.length > 8 ? 'scrollbar-thin max-h-[288px] overflow-y-auto' : ''}`}
                >
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
                                            {label}
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
            </CollapsibleSection>

            <Separator />

            {/* Travelers Field */}
            <div className="py-3 sm:py-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
                    {lang === 'fr'
                        ? 'Voyageurs'
                        : lang === 'ar'
                          ? 'المسافرون'
                          : 'Travelers'}
                </h3>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={() =>
                            onTravelersChange(Math.max(1, travelers - 1))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-base font-bold text-foreground transition-colors hover:bg-muted sm:h-10 sm:w-10 sm:text-lg"
                    >
                        -
                    </button>
                    <span className="min-w-[1.5rem] text-center text-base font-medium text-foreground sm:min-w-[2rem] sm:text-lg">
                        {travelers}
                    </span>
                    <button
                        type="button"
                        onClick={() => onTravelersChange(travelers + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-base font-bold text-foreground transition-colors hover:bg-muted sm:h-10 sm:w-10 sm:text-lg"
                    >
                        +
                    </button>
                </div>
            </div>

            <Separator />

            {/* Price Filter */}
            <div className="py-3 sm:py-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
                    {lang === 'fr'
                        ? 'Budget'
                        : lang === 'ar'
                          ? 'الميزانية'
                          : 'Budget'}
                </h3>
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
                        <span>{minPrice} TND</span>
                        <span className="font-medium text-foreground">
                            {priceRange[0]} TND - {priceRange[1]} TND
                        </span>
                        <span>{maxPrice} TND</span>
                    </div>
                </div>
            </div>

            {/* Category Types from API */}
            {categoryTypes.map((catType) => (
                <div key={catType.key}>
                    <Separator />
                    <FilterRenderer
                        categoryType={catType}
                        selectedValues={categoryTypeFilters[catType.key] ?? []}
                        onChange={(values) =>
                            onCategoryTypeChange(catType.key, values)
                        }
                        lang={lang}
                        items={travels}
                    />
                </div>
            ))}
        </div>
    );
}
