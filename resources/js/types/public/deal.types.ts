import type { LocalizedText } from '../common';

/**
 * Deal item - promotional deal
 */
export interface DealItem {
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    // optional category key used by frontend filters
    category_key?: string;
    category: LocalizedText;
    discount: LocalizedText;
    expires?: LocalizedText;
    highlights?: LocalizedText[];
    terms?: LocalizedText[];
}
