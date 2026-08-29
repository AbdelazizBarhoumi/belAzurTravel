import { useMemo } from 'react';
import type { PublicCategoryType } from '@/hooks/usePublicData';

export interface CategorizedItem {
    category_assignments?: Record<string, string | string[]>;
}

interface CheckboxFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
    items?: CategorizedItem[];
}

export function CheckboxFilter({
    categoryType,
    selectedValues,
    onChange,
    lang,
    preview,
    items = [],
}: CheckboxFilterProps) {
    // Calculate counts for each value based on category_assignments
    const valueCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const val of categoryType.values) {
            counts[val.key] = items.filter((item) => {
                const assignments = item.category_assignments;
                if (!assignments) return false;
                const assigned = assignments[categoryType.key];
                // assigned may be a string or an array of strings
                // (e.g. pricing_type from multiple boarding codes).
                if (Array.isArray(assigned)) {
                    return assigned.includes(val.key);
                }
                return assigned === val.key;
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
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-xs">
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
                                    onChange={() => toggle(val.key)}
                                    className="sr-only"
                                />
                                <span
                                    className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                                >
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
