import { localizeText } from '@/api/entities.api';
import type { PublicCategory } from '@/hooks/usePublicData';
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
