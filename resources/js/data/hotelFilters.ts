export interface HotelFilterOption {
    key: string;
    label: { en: string; fr: string; ar: string };
}

export interface HotelFilterGroup {
    key: string;
    label: { en: string; fr: string; ar: string };
    type: 'checkbox' | 'price';
    options?: HotelFilterOption[];
    dynamic?: boolean;
    priceMin?: number;
    priceMax?: number;
}

export const HOTEL_FILTER_GROUPS: HotelFilterGroup[] = [
    {
        key: 'pays',
        label: { en: 'Country', fr: 'Pays', ar: 'البلد' },
        type: 'checkbox',
        dynamic: true,
    },
    {
        key: 'categorie',
        label: { en: 'Category', fr: 'Catégorie', ar: 'فئة' },
        type: 'checkbox',
        dynamic: true,
    },
    {
        key: 'tarifs_disponibilites',
        label: {
            en: 'Tariffs & Availability',
            fr: 'Tarifs et disponibilités',
            ar: 'الأسعار والتوفر',
        },
        type: 'checkbox',
        options: [
            {
                key: 'htel_recommande',
                label: {
                    en: 'Recommended hotel',
                    fr: 'Hôtel recommandé',
                    ar: 'فندق موصى به',
                },
            },
            {
                key: 'tarifs_promo',
                label: {
                    en: 'Promotional rates',
                    fr: 'Tarifs en promotion',
                    ar: 'أسعار ترويجية',
                },
            },
            {
                key: 'enfant_gratuit',
                label: {
                    en: 'Free for children',
                    fr: 'Enfant gratuit',
                    ar: 'أطفال مجانا',
                },
            },
            {
                key: 'disponible_seulement',
                label: {
                    en: 'Available only',
                    fr: 'Disponible seulement',
                    ar: 'متاح فقط',
                },
            },
            {
                key: 'annulation_gratuite',
                label: {
                    en: 'Free cancellation',
                    fr: 'Annulation gratuite',
                    ar: 'إلغاء مجاني',
                },
            },
        ],
    },
    {
        key: 'arrangements',
        label: { en: 'Arrangements', fr: 'Arrangements', ar: 'ترتيبات' },
        type: 'checkbox',
        options: [
            {
                key: 'logement_simple',
                label: {
                    en: 'Simple accommodation',
                    fr: 'Logement Simple',
                    ar: 'إقامة بسيطة',
                },
            },
            {
                key: 'petit_dejeuner',
                label: { en: 'Breakfast', fr: 'Petit Déjeuner', ar: 'فطور' },
            },
            {
                key: 'demi_pension',
                label: {
                    en: 'Half board',
                    fr: 'Demi Pension',
                    ar: 'نصف إقامة',
                },
            },
            {
                key: 'pension_complete',
                label: {
                    en: 'Full board',
                    fr: 'Pension Complète',
                    ar: 'إقامة كاملة',
                },
            },
        ],
    },
    {
        key: 'budget',
        label: { en: 'Budget', fr: 'Budget', ar: 'الميزانية' },
        type: 'price',
        priceMin: 0,
        priceMax: 1000,
    },
    {
        key: 'type_chambres',
        label: { en: 'Room Type', fr: 'Type de chambres', ar: 'نوع الغرفة' },
        type: 'checkbox',
        options: [
            {
                key: 'chambre_double',
                label: {
                    en: 'Double room',
                    fr: 'Chambre Double',
                    ar: 'غرفة مزدوجة',
                },
            },
            { key: 'suite', label: { en: 'Suite', fr: 'Suite', ar: 'جناح' } },
            {
                key: 'chambre_standard',
                label: {
                    en: 'Standard room',
                    fr: 'Chambre Standard',
                    ar: 'غرفة قياسية',
                },
            },
            {
                key: 'suite_junior',
                label: {
                    en: 'Junior suite',
                    fr: 'Suite Junior',
                    ar: 'جناح صغير',
                },
            },
        ],
    },
    {
        key: 'service',
        label: { en: 'Service', fr: 'Service', ar: 'خدمة' },
        type: 'checkbox',
        options: [
            {
                key: 'thalasso_spa',
                label: {
                    en: 'Thalasso & Spa',
                    fr: 'Thalasso & Spa',
                    ar: 'ثالاسو وسبا',
                },
            },
            {
                key: 'nature_aventure',
                label: {
                    en: 'Nature and Adventure',
                    fr: 'Nature et Aventure',
                    ar: 'طبيعة ومغامرة',
                },
            },
            {
                key: 'famille',
                label: { en: 'Family', fr: 'Famille', ar: 'عائلة' },
            },
            {
                key: 'affaires',
                label: { en: 'Business', fr: 'Affaires', ar: 'أعمال' },
            },
            {
                key: 'sport_loisir',
                label: {
                    en: 'Sports & Leisure',
                    fr: 'Sport & Loisir',
                    ar: 'رياضة وترفيه',
                },
            },
            {
                key: 'detente',
                label: { en: 'Relaxation', fr: 'Détente', ar: 'استرخاء' },
            },
        ],
    },
];

export const HOTEL_FILTER_KEYS = HOTEL_FILTER_GROUPS.flatMap(
    (group) => group.options?.map((opt) => opt.key) ?? [],
);

export const STARS_LABELS: Record<
    number,
    { en: string; fr: string; ar: string }
> = {
    1: { en: '1 Star', fr: '★ (1 étoile)', ar: '1 نجمة' },
    2: { en: '2 Stars', fr: '★★ (2 étoiles)', ar: '2 نجمة' },
    3: { en: '3 Stars', fr: '★★★ (3 étoiles)', ar: '3 نجوم' },
    4: { en: '4 Stars', fr: '★★★★ (4 étoiles)', ar: '4 نجوم' },
    5: { en: '5 Stars', fr: '★★★★★ (5 étoiles)', ar: '5 نجوم' },
};
