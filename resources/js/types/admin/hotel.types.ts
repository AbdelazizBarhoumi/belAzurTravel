import type { LocalizedText } from '../common';
import type { AdminEntity } from './common';

/**
 * Admin hotel - displayed in admin panel
 */
export interface AdminHotel extends AdminEntity {
    id: string;
    name: string;
    location: string;
    category_key?: string;
    category: string;
    price: number;
    rating: number;
    image: string;
}

/**
 * Admin hotel with localized fields (storage format)
 */
export interface LocalizedAdminHotel extends Omit<
    AdminHotel,
    'name' | 'location' | 'category'
> {
    name: LocalizedText;
    location: LocalizedText;
    category: LocalizedText;
}
