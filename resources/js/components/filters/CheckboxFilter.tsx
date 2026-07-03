import { Checkbox } from '@/components/ui/checkbox';
import type { PublicCategoryType } from '@/hooks/usePublicData';
import { useLanguage } from '@/contexts/LanguageContext';

interface CheckboxFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function CheckboxFilter({ categoryType, selectedValues, onChange, lang, preview }: CheckboxFilterProps) {
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
            <div className="space-y-1.5">
                {categoryType.values.map((val) => {
                    const isChecked = selectedValues.includes(val.key);
                    return (
                        <label
                            key={val.key}
                            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/50 cursor-pointer"
                        >
                            <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggle(val.key)}
                            />
                            <span className={isChecked ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                                {val.name[lang] || val.name.en}
                            </span>
                        </label>
                    );
                })}
            </div>
            {selectedValues.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                    {selectedValues.length} {t('filters.selected')}
                </p>
            )}
        </div>
    );
}
