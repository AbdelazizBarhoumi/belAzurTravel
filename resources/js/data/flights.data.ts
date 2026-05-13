import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface FlightItem {
    id: string;
    airline: LocalizedText;
    from: string;
    to: LocalizedText;
    duration: LocalizedText;
    price: number;
    stops: LocalizedText;
    departure: string;
    arrival: string;
    cabin: LocalizedText;
    aircraft: LocalizedText;
    baggage: LocalizedText;
    refund: LocalizedText;
}

export const flightsData: FlightItem[] = [
    {
        id: 'emirates-nyc-dxb',
        airline: { fr: 'Emirates', ar: 'طيران الإمارات', en: 'Emirates' },
        from: 'NYC',
        to: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
        duration: { fr: '12 h 30 min', ar: '12 ساعة و30 دقيقة', en: '12h 30m' },
        price: 890,
        stops: { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
        departure: '09:45',
        arrival: '06:15+1',
        cabin: { fr: 'Économie Flex', ar: 'اقتصادي مرن', en: 'Economy Flex' },
        aircraft: { fr: 'Boeing 777-300ER', ar: 'بوينغ 777-300ER', en: 'Boeing 777-300ER' },
        baggage: { fr: '1 bagage cabine + 1 bagage enregistré', ar: '1 حقيبة يد + 1 حقيبة مسجلة', en: '1 cabin + 1 checked bag' },
        refund: { fr: 'Remboursable partiellement', ar: 'قابل للاسترداد جزئيًا', en: 'Partially refundable' },
    },
    {
        id: 'airfrance-nyc-par',
        airline: { fr: 'Air France', ar: 'الخطوط الجوية الفرنسية', en: 'Air France' },
        from: 'NYC',
        to: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        duration: { fr: '7 h 20 min', ar: '7 ساعات و20 دقيقة', en: '7h 20m' },
        price: 620,
        stops: { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
        departure: '20:30',
        arrival: '09:50+1',
        cabin: { fr: 'Économie Standard', ar: 'اقتصادي قياسي', en: 'Economy Standard' },
        aircraft: { fr: 'Airbus A350-900', ar: 'إيرباص A350-900', en: 'Airbus A350-900' },
        baggage: { fr: '1 bagage cabine + 1 bagage enregistré', ar: '1 حقيبة يد + 1 حقيبة مسجلة', en: '1 cabin + 1 checked bag' },
        refund: { fr: 'Non remboursable', ar: 'غير قابل للاسترداد', en: 'Non-refundable' },
    },
    {
        id: 'singapore-lax-tyo',
        airline: { fr: 'Singapore Airlines', ar: 'الخطوط الجوية السنغافورية', en: 'Singapore Airlines' },
        from: 'LAX',
        to: { fr: 'Tokyo', ar: 'طوكيو', en: 'Tokyo' },
        duration: { fr: '11 h 45 min', ar: '11 ساعة و45 دقيقة', en: '11h 45m' },
        price: 1120,
        stops: { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
        departure: '11:00',
        arrival: '16:45+1',
        cabin: { fr: 'Économie Premium', ar: 'اقتصادي ممتاز', en: 'Premium Economy' },
        aircraft: { fr: 'Boeing 787-9 Dreamliner', ar: 'بوينغ 787-9 دريملاينر', en: 'Boeing 787-9 Dreamliner' },
        baggage: { fr: '2 bagages enregistrés', ar: '2 حقيبتان مسجلتان', en: '2 checked bags' },
        refund: { fr: 'Remboursable avec frais', ar: 'قابل للاسترداد مقابل رسوم', en: 'Refundable with fee' },
    },
];
