import type { LocalizedText } from '../common';

/**
 * Flight item - individual flight with route and pricing
 */
export interface FlightItem {
    id: string;
    code: string;
    airline: LocalizedText;
    from: string;
    to: LocalizedText;
    departure: string;
    arrival: string;
    duration: LocalizedText;
    stops: LocalizedText;
    price: number;
    details: {
        date?: string;
        seats?: number | null;
        cabin: LocalizedText;
        aircraft?: LocalizedText;
        baggage?: LocalizedText;
        refund?: LocalizedText;
    };
}
