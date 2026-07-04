import type { LocalizedText } from '../common';
import type { AdminEntity } from './common';

export interface AdminTravel extends AdminEntity {
    id: string;
    name: string;
    location: string;
    duration: string;
    price: number;
    rating: number;
    image: string;
    category_key?: string;
    itinerary?: ItineraryDay[];
    includes?: string[];
    excludes?: string[];
}

export interface LocalizedAdminTravel extends Omit<
    AdminTravel,
    'name' | 'location' | 'duration'
> {
    name: LocalizedText;
    location: LocalizedText;
    duration: LocalizedText;
}

export interface TravelFormState {
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

export interface ItineraryDay {
    title: LocalizedText;
    details: LocalizedText;
}
