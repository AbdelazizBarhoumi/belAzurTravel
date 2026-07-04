import { useLanguage } from '@/contexts/LanguageContext';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface PillFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function PillFilter({ categoryType, selectedValues, onChange, lang, preview }: PillFilterProps) {
    const { t } = useLanguage();
    const toggle = (valueKey: string) => {
        if (preview) return;
        const next = selectedValues.includes(valueKey)
            ? selectedValues.filter((v) => v !== valueKey)
            : [...selectedValues, valueKey];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryType.label[lang] || categoryType.label.en}
                </h4>
                {selectedValues.length > 0 && !preview && (
                    <button
                        onClick={() => onChange([])}
                        className="text-[10px] text-primary hover:underline"
                    >
                        {t('filters.clear')}
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {categoryType.values.map((val) => {
                    const isActive = selectedValues.includes(val.key);
                    return (
                        <button
                            key={val.key}
                            onClick={() => toggle(val.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                isActive
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {val.name[lang] || val.name.en}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
