import { localizeText } from '@/api/entities.api';
import type { PublicCategory, PublicCategoryType } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

export function getLocalizedCategoryLabel(
    category: Pick<PublicCategory, 'name' | 'key'> | null | undefined,
    lang: Lang,
): string {
    if (!category) {
        return '';
    }

    return localizeText(category.name, lang) || category.key;
}

export function getLocalizedCategoryLabelByKey(
    categories: PublicCategory[],
    categoryKey: string,
    lang: Lang,
): string {
    const category = categories.find((item) => item.key === categoryKey);

    return getLocalizedCategoryLabel(category, lang) || categoryKey;
}

export function getHotelCategoryLabels(
    assignments: Record<string, string> | undefined,
    categoryTypes: PublicCategoryType[],
    lang: Lang,
    maxCount = 3,
): string[] {
    if (!assignments) return [];
    const labels: string[] = [];
    for (const catType of categoryTypes) {
        if (labels.length >= maxCount) break;
        const valueKey = assignments[catType.key];
        if (!valueKey) continue;
        const value = catType.values.find((v) => v.key === valueKey);
        if (value) {
            labels.push(value.name[lang] || value.name.en || valueKey);
        }
    }
    return labels;
}
