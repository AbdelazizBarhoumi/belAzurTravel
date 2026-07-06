import { useMemo } from 'react';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface CheckboxFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
    items?: any[];
}

export function CheckboxFilter({ categoryType, selectedValues, onChange, lang, preview, items = [] }: CheckboxFilterProps) {
    // Calculate counts for each value based on category_assignments
    const valueCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const val of categoryType.values) {
            counts[val.key] = items.filter((item) => {
                const assignments = item.category_assignments;
                return assignments && assignments[categoryType.key] === val.key;
            }).length;
        }
        return counts;
    }, [categoryType, items]);

    const toggle = (valueKey: string) => {
        if (preview) return;
        const next = selectedValues.includes(valueKey)
            ? selectedValues.filter((v) => v !== valueKey)
            : [...selectedValues, valueKey];
        onChange(next);
    };

    return (
        <div>
            {/* Group title */}
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 sm:mb-3">
                {categoryType.label[lang] || categoryType.label.en}
            </h3>

            {/* Checkbox options */}
            <div className="space-y-0.5 sm:space-y-1">
                {categoryType.values.map((val) => {
                    const isActive = selectedValues.includes(val.key);
                    const count = valueCounts[val.key] || 0;
                    return (
                        <label
                            key={val.key}
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
                                    onChange={() => toggle(val.key)}
                                    className="sr-only"
                                />
                                <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                    {val.name[lang] || val.name.en}
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
    );
}