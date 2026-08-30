import type { LocalizedText } from '../common';

/**
 * Individual flight segment for multi-city itineraries
 */
export interface FlightSegment {
    id?: number;
    segment_order: number;
    from_airport: string;
    to_airport: string;
    departure_time: string;
    arrival_time: string;
    date: string | null;
    duration: string | null;
}

/**
 * Flight item - individual flight with route and pricing
 */
export interface FlightItem {
    id: string;
    code: string;
    trip_type?: 'round-trip' | 'one-way' | 'multi-city';
    direct_only?: boolean;
    baggage_included?: boolean;
    airline: LocalizedText;
    from: string;
    to: string;
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
    segments?: FlightSegment[];
}
