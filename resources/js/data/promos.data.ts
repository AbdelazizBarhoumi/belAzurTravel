import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface PromoItem {
    code: string;
    title: LocalizedText;
    discount: LocalizedText;
    description: LocalizedText;
    expires: LocalizedText;
    color: string;
    eligibility: string[];
    howToUse: string[];
    terms: string[];
}

export const promosData: PromoItem[] = [
    {
        code: 'SPRING30',
        title: { fr: 'Vente Flash Printemps', ar: 'تخفيضات الربيع السريعة', en: 'Spring Flash Sale' },
        discount: { fr: '30% DE RÉDUCTION', ar: 'خصم 30%', en: '30% OFF' },
        description: { fr: 'Sur toutes les destinations européennes réservées ce mois-ci.', ar: 'على جميع الوجهات الأوروبية المحجوزة هذا الشهر.', en: 'On all European destinations booked this month.' },
        expires: { fr: '31 mars 2026', ar: '31 مارس 2026', en: 'Mar 31, 2026' },
        color: 'from-primary to-primary/70',
        eligibility: ['Selected Europe routes', 'Travel dates within 6 months', 'Minimum 2 travelers'],
        howToUse: ['Copy promo code', 'Open checkout', 'Apply in promo field'],
        terms: ['Valid on selected routes only', 'Cannot be combined with other offers', 'Subject to availability and fare rules'],
    },
    {
        code: 'LOVE2026',
        title: { fr: 'Offre Lune de Miel', ar: 'عرض شهر العسل', en: 'Honeymoon Special' },
        discount: { fr: 'Surclassement Suite OFFERT', ar: 'ترقية جناح مجانية', en: 'FREE Suite Upgrade' },
        description: { fr: 'Surclassement offert et champagne à l’arrivée.', ar: 'ترقية مجانية وشمبانيا عند الوصول.', en: 'Complimentary upgrade and champagne on arrival.' },
        expires: { fr: '31 décembre 2026', ar: '31 ديسمبر 2026', en: 'Dec 31, 2026' },
        color: 'from-secondary to-secondary/70',
        eligibility: ['Couple bookings only', 'Minimum 3 nights', 'Participating resorts only'],
        howToUse: ['Copy code', 'Select honeymoon package', 'Apply at confirmation step'],
        terms: ['Applies to new bookings only', 'Blackout dates may apply', 'Subject to resort availability'],
    },
    {
        code: 'GROUP10',
        title: { fr: 'Aventure en Groupe', ar: 'مغامرة جماعية', en: 'Group Adventure' },
        discount: { fr: '10% DE RÉDUCTION', ar: 'خصم 10%', en: '10% OFF' },
        description: { fr: 'Groupes de 6+ sur n’importe quelle visite guidée dans le monde.', ar: 'للمجموعات من 6 أشخاص وأكثر على أي جولة موجهة حول العالم.', en: 'Groups of 6+ on any guided tour worldwide.' },
        expires: { fr: 'En cours', ar: 'مستمر', en: 'Ongoing' },
        color: 'from-primary/80 to-secondary',
        eligibility: ['Minimum group size: 6', 'Single checkout for entire group', 'Valid for tours category'],
        howToUse: ['Assign group leader', 'Collect traveler data', 'Apply code before payment'],
        terms: ['Valid for group bookings of 6+', 'Not valid with special event fares', 'Promo can be withdrawn without notice'],
    },
];
