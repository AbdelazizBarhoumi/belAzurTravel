import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface SliderFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function SliderFilter({ categoryType, selectedValues, onChange, lang, preview }: SliderFilterProps) {
    const { t } = useLanguage();
    const valueKeys = categoryType.values.map((v) => v.key);
    const currentIndex = selectedValues.length > 0
        ? valueKeys.indexOf(selectedValues[selectedValues.length - 1])
        : 0;

    const handleChange = (newValue: number[]) => {
        if (preview) return;
        const idx = newValue[0];
        if (idx >= 0 && idx < valueKeys.length) {
            onChange([valueKeys[idx]]);
        }
    };

    const currentLabel = categoryType.values[currentIndex]
        ? (categoryType.values[currentIndex].name[lang] || categoryType.values[currentIndex].name.en)
        : '';

    return (
        <div className="space-y-3">
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
            <div className="px-2">
                <Slider
                    value={[currentIndex]}
                    onValueChange={handleChange}
                    min={0}
                    max={valueKeys.length - 1}
                    step={1}
                    disabled={preview}
                />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-2">
                <span>{categoryType.values[0]?.name[lang] || categoryType.values[0]?.name.en}</span>
                <span className="font-medium text-foreground">{currentLabel}</span>
                <span>{categoryType.values[valueKeys.length - 1]?.name[lang] || categoryType.values[valueKeys.length - 1]?.name.en}</span>
            </div>
        </div>
    );
}
