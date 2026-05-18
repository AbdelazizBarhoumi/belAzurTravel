import type { LocalizedText } from '../common';

/**
 * Car item - brief view with rental details
 */
export interface CarItem {
    slug: string;
    name: LocalizedText;
    category: LocalizedText;
    fuel: LocalizedText;
    transmission: LocalizedText;
    seats: number;
    price: number;
    image: string;
    gallery?: string[];
    description?: LocalizedText;
    features: LocalizedText[];
    policy: LocalizedText[];
}
