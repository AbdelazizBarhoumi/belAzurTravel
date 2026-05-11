import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface FlightItem {
    id: string;
    airline: LocalizedText;
    from: string;
    to: LocalizedText;
    duration: string;
    price: number;
    stops: LocalizedText;
    departure: string;
    arrival: string;
    cabin: string;
    baggage: string;
    refund: string;
}

export const flightsData: FlightItem[] = [
    {
        id: 'emirates-nyc-dxb',
        airline: { fr: 'Emirates', ar: 'طيران الإمارات', en: 'Emirates' },
        from: 'NYC',
        to: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
        duration: '12h 30m',
        price: 890,
        stops: { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
        departure: '09:45',
        arrival: '06:15+1',
        cabin: 'Economy Flex',
        baggage: '1 cabin + 1 checked bag',
        refund: 'Partially refundable',
    },
    {
        id: 'airfrance-nyc-par',
        airline: { fr: 'Air France', ar: 'الخطوط الجوية الفرنسية', en: 'Air France' },
        from: 'NYC',
        to: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        duration: '7h 20m',
        price: 620,
        stops: { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
        departure: '20:30',
        arrival: '09:50+1',
        cabin: 'Economy Standard',
        baggage: '1 cabin + 1 checked bag',
        refund: 'Non-refundable',
    },
    {
        id: 'singapore-lax-tyo',
        airline: { fr: 'Singapore Airlines', ar: 'الخطوط الجوية السنغافورية', en: 'Singapore Airlines' },
        from: 'LAX',
        to: { fr: 'Tokyo', ar: 'طوكيو', en: 'Tokyo' },
        duration: '11h 45m',
        price: 1120,
        stops: { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
        departure: '11:00',
        arrival: '16:45+1',
        cabin: 'Premium Economy',
        baggage: '2 checked bags',
        refund: 'Refundable with fee',
    },
];
