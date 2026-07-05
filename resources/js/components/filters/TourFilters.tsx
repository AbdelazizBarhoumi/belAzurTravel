import { useMemo } from 'react';
import { TOUR_FILTER_GROUPS, TOUR_FILTER_KEYS } from '@/data/tourFilters';

interface TourFiltersProps {
    selectedFilters: Record<string, boolean>;
    onFilterChange: (key: string, value: boolean) => void;
    tours: any[];
    lang: string;
}

export function TourFilters({
    selectedFilters,
    onFilterChange,
    tours,
    lang,
}: TourFiltersProps) {
    // Calculate counts for each filter option
    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const key of TOUR_FILTER_KEYS) {
            counts[key] = tours.filter((tour) => (tour as any)[key] === true).length;
        }
        return counts;
    }, [tours]);

    return (
        <div className="space-y-0">
            {TOUR_FILTER_GROUPS.map((group, groupIndex) => (
                <div key={group.key}>
                    {/* Separator line between groups */}
                    {groupIndex > 0 && (
                        <div className="border-t border-border my-4" />
                    )}

                    {/* Group title */}
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        {group.label[lang] || group.label.en}
                    </h3>

                    {/* Checkbox options */}
                    {group.type === 'checkbox' && group.options && (
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