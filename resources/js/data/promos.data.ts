import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface PromoItem {
    code: string;
    title: LocalizedText;
    discount: LocalizedText;
    description: LocalizedText;
    expires: LocalizedText;
    color: string;
    eligibility: LocalizedText[];
    howToUse: LocalizedText[];
    terms: LocalizedText[];
}

export const promosData: PromoItem[] = [
    {
        code: 'SPRING30',
        title: { fr: 'Vente Flash Printemps', ar: 'تخفيضات الربيع السريعة', en: 'Spring Flash Sale' },
        discount: { fr: '30% DE RÉDUCTION', ar: 'خصم 30%', en: '30% OFF' },
        description: { fr: 'Sur toutes les destinations européennes réservées ce mois-ci.', ar: 'على جميع الوجهات الأوروبية المحجوزة هذا الشهر.', en: 'On all European destinations booked this month.' },
        expires: { fr: '31 mars 2026', ar: '31 مارس 2026', en: 'Mar 31, 2026' },
        color: 'from-primary to-primary/70',
        eligibility: [
            { fr: 'Itinéraires européens sélectionnés', ar: 'مسارات أوروبية مختارة', en: 'Selected Europe routes' },
            { fr: 'Dates de voyage dans les 6 mois', ar: 'تواريخ السفر خلال 6 أشهر', en: 'Travel dates within 6 months' },
            { fr: 'Minimum 2 voyageurs', ar: 'بحد أدنى مسافران', en: 'Minimum 2 travelers' },
        ],
        howToUse: [
            { fr: 'Copier le code promo', ar: 'انسخ رمز العرض', en: 'Copy promo code' },
            { fr: 'Ouvrir le paiement', ar: 'افتح صفحة الدفع', en: 'Open checkout' },
            { fr: 'Appliquer dans le champ promo', ar: 'طبّقه في خانة العرض', en: 'Apply in promo field' },
        ],
        terms: [
            { fr: 'Valable uniquement sur les itinéraires sélectionnés', ar: 'ساري فقط على المسارات المختارة', en: 'Valid on selected routes only' },
            { fr: 'Non cumulable avec d’autres offres', ar: 'لا يمكن دمجه مع عروض أخرى', en: 'Cannot be combined with other offers' },
            { fr: 'Sous réserve de disponibilité et des règles tarifaires', ar: 'حسب التوفر وقواعد السعر', en: 'Subject to availability and fare rules' },
        ],
    },
    {
        code: 'LOVE2026',
        title: { fr: 'Offre Lune de Miel', ar: 'عرض شهر العسل', en: 'Honeymoon Special' },
        discount: { fr: 'Surclassement Suite OFFERT', ar: 'ترقية جناح مجانية', en: 'FREE Suite Upgrade' },
        description: { fr: 'Surclassement offert et champagne à l’arrivée.', ar: 'ترقية مجانية وشمبانيا عند الوصول.', en: 'Complimentary upgrade and champagne on arrival.' },
        expires: { fr: '31 décembre 2026', ar: '31 ديسمبر 2026', en: 'Dec 31, 2026' },
        color: 'from-secondary to-secondary/70',
        eligibility: [
            { fr: 'Réservations de couples uniquement', ar: 'حجوزات الأزواج فقط', en: 'Couple bookings only' },
            { fr: 'Minimum 3 nuits', ar: '3 ليالٍ كحد أدنى', en: 'Minimum 3 nights' },
            { fr: 'Seulement dans les resorts participants', ar: 'فقط في المنتجعات المشاركة', en: 'Participating resorts only' },
        ],
        howToUse: [
            { fr: 'Copier le code', ar: 'انسخ الرمز', en: 'Copy code' },
            { fr: 'Sélectionner le forfait lune de miel', ar: 'اختر باقة شهر العسل', en: 'Select honeymoon package' },
            { fr: 'Appliquer à l’étape de confirmation', ar: 'طبّقه في خطوة التأكيد', en: 'Apply at confirmation step' },
        ],
        terms: [
            { fr: 'Valable pour les nouvelles réservations uniquement', ar: 'ساري على الحجوزات الجديدة فقط', en: 'Applies to new bookings only' },
            { fr: 'Des dates d’exclusion peuvent s’appliquer', ar: 'قد تنطبق تواريخ استبعاد', en: 'Blackout dates may apply' },
            { fr: 'Sous réserve de disponibilité du resort', ar: 'حسب توفر المنتجع', en: 'Subject to resort availability' },
        ],
    },
    {
        code: 'GROUP10',
        title: { fr: 'Aventure en Groupe', ar: 'مغامرة جماعية', en: 'Group Adventure' },
        discount: { fr: '10% DE RÉDUCTION', ar: 'خصم 10%', en: '10% OFF' },
        description: { fr: 'Groupes de 6+ sur n’importe quelle visite guidée dans le monde.', ar: 'للمجموعات من 6 أشخاص وأكثر على أي جولة موجهة حول العالم.', en: 'Groups of 6+ on any guided tour worldwide.' },
        expires: { fr: 'En cours', ar: 'مستمر', en: 'Ongoing' },
        color: 'from-primary/80 to-secondary',
        eligibility: [
            { fr: 'Taille de groupe minimale : 6', ar: 'حجم المجموعة الأدنى: 6', en: 'Minimum group size: 6' },
            { fr: 'Paiement unique pour tout le groupe', ar: 'دفع واحد للمجموعة بأكملها', en: 'Single checkout for entire group' },
            { fr: 'Valable pour la catégorie circuits', ar: 'ساري على فئة الجولات', en: 'Valid for tours category' },
        ],
        howToUse: [
            { fr: 'Attribuer un chef de groupe', ar: 'عيّن قائدًا للمجموعة', en: 'Assign group leader' },
            { fr: 'Collecter les informations des voyageurs', ar: 'اجمع بيانات المسافرين', en: 'Collect traveler data' },
            { fr: 'Appliquer le code avant le paiement', ar: 'طبّق الرمز قبل الدفع', en: 'Apply code before payment' },
        ],
        terms: [
            { fr: 'Valable pour les réservations de groupe de 6+ ', ar: 'ساري على حجوزات المجموعات من 6+ ', en: 'Valid for group bookings of 6+' },
            { fr: 'Non valable avec les tarifs d’événements spéciaux', ar: 'غير صالح مع أسعار الفعاليات الخاصة', en: 'Not valid with special event fares' },
            { fr: 'La promotion peut être retirée sans préavis', ar: 'يمكن سحب العرض دون إشعار مسبق', en: 'Promo can be withdrawn without notice' },
        ],
    },
];
