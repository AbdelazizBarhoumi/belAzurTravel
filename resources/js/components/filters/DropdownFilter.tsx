import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PublicCategoryType } from '@/hooks/usePublicData';

interface DropdownFilterProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function DropdownFilter({ categoryType, selectedValues, onChange, lang, preview }: DropdownFilterProps) {
    const { t } = useLanguage();
    const handleSelect = (valueKey: string) => {
        if (preview) return;
        if (!selectedValues.includes(valueKey)) {
            onChange([...selectedValues, valueKey]);
        }
    };

    const removeValue = (valueKey: string) => {
        if (preview) return;
        onChange(selectedValues.filter((v) => v !== valueKey));
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
            <Select onValueChange={handleSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={`${t('filters.selectPlaceholder')} ${categoryType.label[lang] || categoryType.label.en}...`} />
                </SelectTrigger>
                <SelectContent>
                    {categoryType.values
                        .filter((val) => !selectedValues.includes(val.key))
                        .map((val) => (
                            <SelectItem key={val.key} value={val.key}>
                                {val.name[lang] || val.name.en}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
            {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedValues.map((vKey) => {
                        const val = categoryType.values.find((v) => v.key === vKey);
                        if (!val) return null;
                        return (
                            <Badge
                                key={vKey}
                                variant="secondary"
                                className="cursor-pointer hover:bg-destructive/10"
                                onClick={() => removeValue(vKey)}
                            >
                                {val.name[lang] || val.name.en}
                                <span className="ml-1 text-muted-foreground">×</span>
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
