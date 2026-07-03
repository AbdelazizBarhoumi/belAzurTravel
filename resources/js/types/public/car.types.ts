import type { LocalizedText } from '../common';

/**
 * Car item - brief view with rental details
 */
export interface CarItem {
    // unique id from backend (optional for some endpoints)
    id?: string | number;
    slug: string;
    name: LocalizedText;
    // key of the category (e.g. "suv", "sedan") when provided by the API
    category_key?: string;
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
    category_assignments?: Record<string, string>;
}
