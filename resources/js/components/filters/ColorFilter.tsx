import { useLanguage } from '@/contexts/LanguageContext';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface ColorFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function ColorFilter({ categoryType, selectedValues, onChange, lang, preview }: ColorFilterProps) {
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
            <div className="flex flex-wrap gap-2">
                {categoryType.values.map((val) => {
                    const isActive = selectedValues.includes(val.key);
                    const color = val.color || '#888888';
                    return (
                        <button
                            key={val.key}
                            onClick={() => toggle(val.key)}
                            title={val.name[lang] || val.name.en}
                            className={`h-8 w-8 rounded-full border-2 transition-all ${
                                isActive
                                    ? 'border-foreground scale-110 ring-2 ring-foreground/20'
                                    : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                        />
                    );
                })}
            </div>
            {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {selectedValues.map((vKey) => {
                        const val = categoryType.values.find((v) => v.key === vKey);
                        if (!val) return null;
                        return (
                            <span key={vKey} className="text-[10px] text-muted-foreground">
                                {val.name[lang] || val.name.en}
                                {vKey !== selectedValues[selectedValues.length - 1] && ', '}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
