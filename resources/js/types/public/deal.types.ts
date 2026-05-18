import type { LocalizedText } from '../common';

/**
 * Deal item - promotional deal
 */
export interface DealItem {
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    category: LocalizedText;
    discount: LocalizedText;
    expires?: LocalizedText;
    highlights?: LocalizedText[];
    terms?: LocalizedText[];
}
