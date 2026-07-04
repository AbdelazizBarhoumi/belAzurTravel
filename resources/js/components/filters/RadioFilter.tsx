import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface RadioFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function RadioFilter({ categoryType, selectedValues, onChange, lang, preview }: RadioFilterProps) {
    const { t } = useLanguage();
    const currentValue = selectedValues[0] || '';

    const handleChange = (value: string) => {
        if (preview) return;
        onChange(value ? [value] : []);
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
            <RadioGroup
                value={currentValue}
                onValueChange={handleChange}
                disabled={preview}
            >
                {categoryType.values.map((val) => (
                    <div key={val.key} className="flex items-center space-x-2">
                        <RadioGroupItem value={val.key} id={`${categoryType.key}-${val.key}`} />
                        <Label
                            htmlFor={`${categoryType.key}-${val.key}`}
                            className="text-sm font-normal cursor-pointer"
                        >
                            {val.name[lang] || val.name.en}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}
