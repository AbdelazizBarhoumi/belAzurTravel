import type { PublicCategoryType } from '@/hooks/usePublicData';
import { CheckboxFilter, type CategorizedItem } from './CheckboxFilter';

interface FilterRendererProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
    items?: CategorizedItem[];
}

export function FilterRenderer({
    categoryType,
    selectedValues,
    onChange,
    lang,
    preview = false,
    items = [],
}: FilterRendererProps) {
    if (!categoryType.values || categoryType.values.length === 0) {
        return null;
    }

    return (
        <CheckboxFilter
            categoryType={categoryType}
            selectedValues={selectedValues}
            onChange={onChange}
            lang={lang}
            preview={preview}
            items={items}
        />
    );
}
