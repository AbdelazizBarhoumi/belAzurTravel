import { useMemo } from 'react';
import { TRAVEL_FILTER_GROUPS, TRAVEL_FILTER_KEYS } from '@/data/travelFilters';
import { localizeText } from '@/data';
import type { TravelItem } from '@/api/entities.api';
import type { Lang } from '@/i18n/translations';

interface TravelFiltersProps {
    selectedFilters: Record<string, boolean>;
    onFilterChange: (key: string, value: boolean) => void;
    travels: TravelItem[];
    lang: string;
}

export function TravelFilters({
    selectedFilters,
    onFilterChange,
    travels,
    lang,
}: TravelFiltersProps) {
    const typedLang = lang as Lang;

    // Calculate counts for each filter option
    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const key of TRAVEL_FILTER_KEYS) {
            counts[key] = travels.filter((travel) => (travel as any)[key] === true).length;
        }
        return counts;
    }, [travels]);

    // Get unique countries from travels
    const availableCountries = useMemo(() => {
        const countriesMap = new Map<string, { count: number; label: string }>();
        for (const travel of travels) {
            const location = localizeText(travel.location, typedLang);
            if (location) {
                const existing = countriesMap.get(location);
                if (existing) {
                    existing.count++;
                } else {
                    countriesMap.set(location, { count: 1, label: location });
                }
            }
        }
        return Array.from(countriesMap.entries()).sort((a, b) => b[1].count - a[1].count);
    }, [travels, lang]);

    return (
        <div className="space-y-0">
            {TRAVEL_FILTER_GROUPS.map((group, groupIndex) => (
                <div key={group.key}>
                    {/* Separator line between groups */}
                    {groupIndex > 0 && (
                        <div className="border-t border-border my-4" />
                    )}

                    {/* Group title */}
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        {group.label[lang] || group.label.en}
                    </h3>

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
                                                {label}
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