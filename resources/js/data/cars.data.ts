import type { Lang } from '@/i18n/translations';

export type LocalizedText = Record<Lang, string>;

export interface CarItem {
    slug: string;
    name: LocalizedText;
    category: LocalizedText;
    price: number;
    seats: number;
    fuel: LocalizedText;
    transmission: LocalizedText;
    image: string;
    gallery: string[];
    description: LocalizedText;
    features: LocalizedText[];
    policy: LocalizedText[];
}

export const carsData: CarItem[] = [
    {
        slug: 'mercedes-e-class',
        name: {
            fr: 'Mercedes Classe E',
            ar: 'مرسيدس الفئة E',
            en: 'Mercedes E-Class',
        },
        category: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
        price: 120,
        seats: 5,
        fuel: { fr: 'Hybride', ar: 'هجين', en: 'Hybrid' },
        transmission: { fr: 'Automatique', ar: 'أوتوماتيك', en: 'Auto' },
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=560&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'Berline exécutive raffinée avec un confort et une technologie de premier plan.',
            ar: 'سيدان تنفيذية راقية مع راحة وتقنيات رائدة.',
            en: 'Refined executive saloon with class-leading comfort and tech.',
        },
        features: [
            {
                fr: 'Assurance premium',
                ar: 'تأمين مميز',
                en: 'Premium insurance',
            },
            {
                fr: 'Kilométrage illimité',
                ar: 'أميال غير محدودة',
                en: 'Unlimited mileage',
            },
            {
                fr: 'Assistance routière',
                ar: 'مساعدة على الطريق',
                en: 'Roadside assistance',
            },
        ],
        policy: [
            {
                fr: 'Conducteur âgé de 25 ans ou plus',
                ar: 'عمر السائق 25+ سنة',
                en: 'Driver age 25+',
            },
            {
                fr: 'Caution requise',
                ar: 'مطلوب تأمين/وديعة',
                en: 'Deposit required',
            },
            {
                fr: 'Le carburant doit être rendu au même niveau',
                ar: 'يجب إعادة الوقود بنفس المستوى',
                en: 'Fuel must be returned at same level',
            },
        ],
    },
    {
        slug: 'bmw-x5-suv',
        name: { fr: 'BMW X5 SUV', ar: 'بي إم دبليو X5 SUV', en: 'BMW X5 SUV' },
        category: { fr: 'SUV', ar: 'دفع رباعي', en: 'SUV' },
        price: 150,
        seats: 7,
        fuel: { fr: 'Diesel', ar: 'ديزل', en: 'Diesel' },
        transmission: { fr: 'Automatique', ar: 'أوتوماتيك', en: 'Auto' },
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&h=560&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1551830820-330a71b99659?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'SUV spacieux à 7 places pour les voyages en famille avec transmission intégrale.',
            ar: 'سيارة SUV واسعة لسبعة ركاب للرحلات العائلية مع دفع رباعي.',
            en: 'Spacious 7-seater for family trips with all-wheel drive.',
        },
        features: [
            {
                fr: 'Siège enfant disponible',
                ar: 'مقعد أطفال متاح',
                en: 'Child seat available',
            },
            { fr: 'GPS inclus', ar: 'GPS مشمول', en: 'GPS included' },
            {
                fr: 'Prise en charge aéroport en option',
                ar: 'استقبال من المطار اختياري',
                en: 'Airport pickup optional',
            },
        ],
        policy: [
            {
                fr: 'Conducteur âgé de 25 ans ou plus',
                ar: 'عمر السائق 25+ سنة',
                en: 'Driver age 25+',
            },
            {
                fr: 'Voyage transfrontalier non inclus',
                ar: 'السفر عبر الحدود غير مشمول',
                en: 'Cross-border not included',
            },
            {
                fr: 'Des frais de retard s’appliquent',
                ar: 'تُطبق رسوم التأخير',
                en: 'Late return fee applies',
            },
        ],
    },
    {
        slug: 'tesla-model-3',
        name: { fr: 'Tesla Model 3', ar: 'تسلا موديل 3', en: 'Tesla Model 3' },
        category: { fr: 'Électrique', ar: 'كهربائي', en: 'Electric' },
        price: 130,
        seats: 5,
        fuel: { fr: 'Électrique', ar: 'كهربائي', en: 'Electric' },
        transmission: { fr: 'Automatique', ar: 'أوتوماتيك', en: 'Auto' },
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&h=560&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'Véhicule électrique silencieux avec accélération instantanée et technologie Autopilot.',
            ar: 'سيارة كهربائية هادئة بتسارع فوري وتقنية Autopilot.',
            en: 'Silent, instant-torque EV with Autopilot.',
        },
        features: [
            {
                fr: 'Charge rapide prise en charge',
                ar: 'يدعم الشحن السريع',
                en: 'Fast charging support',
            },
            {
                fr: 'Intérieur premium',
                ar: 'مقصورة داخلية فاخرة',
                en: 'Premium interior',
            },
            {
                fr: 'Assistance Autopilot',
                ar: 'مساعدة Autopilot',
                en: 'Autopilot assistance',
            },
        ],
        policy: [
            {
                fr: 'Câble de recharge inclus',
                ar: 'كابل الشحن مشمول',
                en: 'Charger cable included',
            },
            {
                fr: 'Les coûts de recharge sont facturés séparément',
                ar: 'تُحتسب تكاليف الشحن بشكل منفصل',
                en: 'Charging costs billed separately',
            },
            {
                fr: 'Utilisation en ville recommandée',
                ar: 'مُوصى بالاستخدام داخل المدينة',
                en: 'City-only use recommended',
            },
        ],
    },
];
