import type { LocalizedText } from '../common';
import type { AdminEntity } from './common';

/**
 * Admin tour - displayed in admin panel
 */
export interface AdminTour extends AdminEntity {
    id: string;
    name: string;
    location: string;
    duration: string;
    price: number;
    rating: number;
    image: string;
    // optional rich fields present in editing context
    itinerary?: ItineraryDay[];
    includes?: string[];
    excludes?: string[];
}

/**
 * Admin tour with localized fields (storage format)
 */
export interface LocalizedAdminTour extends Omit<
    AdminTour,
    'name' | 'location' | 'duration'
> {
    name: LocalizedText;
    location: LocalizedText;
    duration: LocalizedText;
}

/**
 * Tour form state for AdminTourForm
 */
export interface TourFormState {
    id?: string | number;
    name_en: string;
    name_fr: string;
    name_ar: string;
    description_en: string;
    description_fr: string;
    description_ar: string;
    price: number;
    rating: number;
    duration_days: number;
    duration_nights: number;
    max_group: number;
    slug: string;
    image?: File | string;
    itinerary: ItineraryDay[];
    includes: string[];
    excludes: string[];
    images: number[];
}

/**
 * Tour itinerary day
 */
export interface ItineraryDay {
    title: LocalizedText;
    details: LocalizedText;
}
