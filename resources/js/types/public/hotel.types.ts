import type { LocalizedText } from '../common';

/**
 * Hotel item - brief view with key info
 */
export interface HotelItem {
    slug: string;
    id: string;
    destinationSlug: string;
    name: LocalizedText;
    location: LocalizedText;
    city?: LocalizedText;
    country?: LocalizedText;
    category_key?: string;
    category?: LocalizedText;
    price: number;
    rating: number;
    stars: number;
    reviews: number;
    image: string;
    tags: string[];
    amenities: string[];
}
