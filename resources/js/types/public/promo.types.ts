import type { LocalizedText } from '../common';

/**
 * Promo item - promotional code/offer
 */
export interface PromoItem {
    code: string;
    title: LocalizedText;
    description: LocalizedText;
    discount: LocalizedText;
    color?: string;
    expires?: LocalizedText;
    eligibility: LocalizedText[];
    howToUse?: LocalizedText[];
    terms: LocalizedText[];
    gallery?: string[];
}
