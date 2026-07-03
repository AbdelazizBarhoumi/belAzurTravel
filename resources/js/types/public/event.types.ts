import type { LocalizedText } from '../common';

/**
 * Event item - event with schedule and details
 */
export interface EventItem {
    slug: string;
    title: LocalizedText;
    date: LocalizedText;
    location: LocalizedText;
    attendees: LocalizedText;
    description: LocalizedText;
    // optional category key used by the API for filtering
    category_key?: string;
    about?: LocalizedText;
    image?: string;
    gallery?: string[];
    price?: number;
    category_assignments?: Record<string, string>;
    schedule?: Array<{
        day: LocalizedText;
        activity: LocalizedText;
        details: LocalizedText;
    }>;
}
