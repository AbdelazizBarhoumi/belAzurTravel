import type { LocalizedText } from '../common';

/**
 * Destination item - public view
 */
export interface DestinationItem {
    id: number;
    slug: string;
    name: LocalizedText;
    country: LocalizedText;
    image: string;
    gallery?: string[];
    images?: string[];
    rating: number;
    price: number;
    categoryKey: string;
    category: LocalizedText;
    description: LocalizedText;
    about?: LocalizedText;
    highlights?: LocalizedText[];
    bestTime?: LocalizedText;
    language?: LocalizedText;
    currency?: LocalizedText;
    weather?: LocalizedText;
    category_assignments?: Record<string, string>;
}

/**
 * Tour detail step in itinerary
 */
export interface TourDetailStep {
    day: number;
    title: LocalizedText;
    details: LocalizedText;
}

/**
 * Tour detail item - detailed view of a tour
 */
export interface TourDetailItem {
    slug: string;
    name: LocalizedText;
    type: LocalizedText;
    location: LocalizedText[];
    durationDays: number;
    durationNights: number;
    maxGroup: number;
    rating: number;
    price: number;
    description: LocalizedText;
    itinerary: TourDetailStep[];
    includes?: LocalizedText[];
    excludes?: LocalizedText[];
    best?: LocalizedText;
    image: string;
    gallery?: string[];
    images?: string[];
}

/**
 * Tour item - brief view
 */
export interface TourItem {
    slug: string;
    name: LocalizedText;
    location: LocalizedText;
    duration: LocalizedText;
    maxGroup: number;
    price: number;
    rating: number;
    // optional category key used by the API
    category_key?: string;
    image: string;
    description: LocalizedText;
    category_assignments?: Record<string, string>;
}
