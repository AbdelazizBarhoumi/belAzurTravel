import type { LocalizedText } from '../common';
import type { AdminEntity } from './common';

/**
 * Admin destination - displayed in admin panel
 */
export interface AdminDestination extends AdminEntity {
    id: string;
    name: string;
    country: string;
    category_key?: string;
    category: string;
    price: number;
    rating: number;
    image: string;
    description: string;
    about?: string;
    gallery?: string[];
    highlights?: string[];
    bestTime?: string;
    language?: string;
    currency?: string;
    weather?: string;
}

/**
 * Admin destination with localized fields (storage format)
 */
export interface LocalizedAdminDestination extends Omit<
    AdminDestination,
    'name' | 'country' | 'category' | 'description'
> {
    name: LocalizedText;
    country: LocalizedText;
    category: LocalizedText;
    description: LocalizedText;
}
