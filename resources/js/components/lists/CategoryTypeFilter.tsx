import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { CategoryType } from '@/hooks/useCategoryTypes';

interface CategoryTypeFilterProps {
    categoryTypes: CategoryType[];
    selectedFilters: Record<string, string[]>;
    onFilterChange: (typeKey: string, values: string[]) => void;
    lang: string;
}

export function CategoryTypeFilter({
    categoryTypes,
    selectedFilters,
    onFilterChange,
    lang,
}: CategoryTypeFilterProps) {
    const toggleValue = (typeKey: string, valueKey: string) => {
        const current = selectedFilters[typeKey] ?? [];
        const next = current.includes(valueKey)
            ? current.filter((v) => v !== valueKey)
            : [...current, valueKey];
        onFilterChange(typeKey, next);
    };

    const clearType = (typeKey: string) => {
        onFilterChange(typeKey, []);
    };

    const hasAnyFilters = Object.values(selectedFilters).some(
        (vals) => vals.length > 0,
    );

    return (
        <div className="space-y-4">
            {categoryTypes.map((catType) => {
                const selected = selectedFilters[catType.key] ?? [];
                if (!catType.values || catType.values.length === 0) return null;

                return (
                    <div key={catType.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {catType.label[lang] || catType.label.en || catType.key}
                            </h4>
                            {selected.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1 text-[10px]"
                                    onClick={() => clearType(catType.key)}
                                >
                                    <X className="mr-0.5 h-3 w-3" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {catType.values.map((val) => {
                                const isSelected = selected.includes(val.key);
                                return (
                                    <Badge
                                        key={val.key}
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={`cursor-pointer select-none text-xs transition-colors ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                                                : 'hover:bg-muted'
                                        }`}
                                        onClick={() => toggleValue(catType.key, val.key)}
                                    >
                                        {val.name[lang] || val.name.en || val.key}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
