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
    about?: LocalizedText;
    image?: string;
    gallery?: string[];
    price?: number;
    schedule?: Array<{
        day: LocalizedText;
        activity: LocalizedText;
        details: LocalizedText;
    }>;
}
