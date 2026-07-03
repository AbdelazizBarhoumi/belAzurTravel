import type { PublicCategoryType } from '@/hooks/usePublicData';
import { PillFilter } from './PillFilter';
import { CheckboxFilter } from './CheckboxFilter';
import { DropdownFilter } from './DropdownFilter';
import { SliderFilter } from './SliderFilter';
import { RadioFilter } from './RadioFilter';
import { ColorFilter } from './ColorFilter';

interface FilterRendererProps {
    categoryType: PublicCategoryType;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    lang: string;
    preview?: boolean;
}

export function FilterRenderer({
    categoryType,
    selectedValues,
    onChange,
    lang,
    preview = false,
}: FilterRendererProps) {
    if (!categoryType.values || categoryType.values.length === 0) {
        return null;
    }

    const style = categoryType.filter_style || 'pills';

    const commonProps = {
        categoryType,
        selectedValues,
        onChange,
        lang,
        preview,
    };

    switch (style) {
        case 'checkbox':
            return <CheckboxFilter {...commonProps} />;
        case 'dropdown':
            return <DropdownFilter {...commonProps} />;
        case 'slider':
            return <SliderFilter {...commonProps} />;
        case 'radio':
            return <RadioFilter {...commonProps} />;
        case 'colors':
            return <ColorFilter {...commonProps} />;
        case 'pills':
        default:
            return <PillFilter {...commonProps} />;
    }
}
