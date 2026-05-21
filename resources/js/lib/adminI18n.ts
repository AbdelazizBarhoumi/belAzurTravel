import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export function localizeAdminValue(
    row: Record<string, unknown>,
    baseKey: string,
    lang: Lang,
): string {
    const candidates = [
        row[`${baseKey}_${lang}`],
        row[`${baseKey}_en`],
        row[baseKey],
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim() !== '') {
            return candidate;
        }
    }

    return '';
}

export function localizeKnown(
    value: string,
    map: Record<string, LocalizedText>,
    lang: Lang,
): string {
    return map[value]?.[lang] ?? value;
}

export const destinationLabels: Record<string, LocalizedText> = {
    Santorini: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
    Bali: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
    Paris: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
    Dubai: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
};

export const countryLabels: Record<string, LocalizedText> = {
    Greece: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
    Indonesia: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
    France: { fr: 'France', ar: 'فرنسا', en: 'France' },
    UAE: {
        fr: 'Émirats Arabes Unis',
        ar: 'الإمارات العربية المتحدة',
        en: 'UAE',
    },
    Japan: { fr: 'Japon', ar: 'اليابان', en: 'Japan' },
    'Indian Ocean': {
        fr: 'Océan Indien',
        ar: 'المحيط الهندي',
        en: 'Indian Ocean',
    },
};

export const categoryLabels: Record<string, LocalizedText> = {
    Beach: { fr: 'Plage', ar: 'شاطئ', en: 'Beach' },
    City: { fr: 'Ville', ar: 'مدينة', en: 'City' },
    Nature: { fr: 'Nature', ar: 'طبيعة', en: 'Nature' },
    Luxury: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
    Adventure: { fr: 'Aventure', ar: 'مغامرة', en: 'Adventure' },
    Boutique: { fr: 'Boutique', ar: 'بوتيك', en: 'Boutique' },
    Resorts: { fr: 'Complexes', ar: 'منتجعات', en: 'Resorts' },
    Budget: { fr: 'Économique', ar: 'اقتصادي', en: 'Budget' },
    Family: { fr: 'Famille', ar: 'عائلي', en: 'Family' },
    'Premium SUV': {
        fr: 'SUV Premium',
        ar: 'دفع رباعي فاخر',
        en: 'Premium SUV',
    },
    SUV: { fr: 'SUV', ar: 'دفع رباعي', en: 'SUV' },
    Compact: { fr: 'Compacte', ar: 'مدمجة', en: 'Compact' },
    Electric: { fr: 'Électrique', ar: 'كهربائي', en: 'Electric' },
};

export const hotelLabels: Record<string, LocalizedText> = {
    'Sunset Paradise Resort': {
        fr: 'Sunset Paradise Resort',
        ar: 'منتجع صن ست بارادايس',
        en: 'Sunset Paradise Resort',
    },
    'Ubud Jungle Retreat': {
        fr: 'Ubud Jungle Retreat',
        ar: 'منتجع أوبود للغابات',
        en: 'Ubud Jungle Retreat',
    },
    'Le Grand Parisien': {
        fr: 'Le Grand Parisien',
        ar: 'لو غراند باريسيان',
        en: 'Le Grand Parisien',
    },
    'Marina Bay Suites': {
        fr: 'Marina Bay Suites',
        ar: 'فندق مارينا باي سويتس',
        en: 'Marina Bay Suites',
    },
    'Imperial Tokyo Hotel': {
        fr: 'Hôtel Impérial Tokyo',
        ar: 'فندق إمبريال طوكيو',
        en: 'Imperial Tokyo Hotel',
    },
    'Overwater Villa Resort': {
        fr: 'Resort Bungalow Océan',
        ar: 'منتجع بنغل المحيط',
        en: 'Overwater Villa Resort',
    },
};

export const tourLabels: Record<string, LocalizedText> = {
    'Greek Island Hopping': {
        fr: 'Îles Grecques en Liberté',
        ar: 'جولة الجزر اليونانية',
        en: 'Greek Island Hopping',
    },
    'Bali Cultural Immersion': {
        fr: 'Immersion Culturelle à Bali',
        ar: 'انغمس في ثقافة بالي',
        en: 'Bali Cultural Immersion',
    },
    'Parisian Art & Gastronomy': {
        fr: 'Paris: Art et Gastronomie',
        ar: 'باريس: الفن والطعام',
        en: 'Parisian Art & Gastronomy',
    },
    'Desert Safari Adventure': {
        fr: 'Aventure Safari du Désert',
        ar: 'مغامرة السفاري في الصحراء',
        en: 'Desert Safari Adventure',
    },
    'Japan Heritage Trail': {
        fr: 'Sentier du Patrimoine Japonais',
        ar: 'درب التراث الياباني',
        en: 'Japan Heritage Trail',
    },
    'Northern Lights Quest': {
        fr: 'Quête des Aurores Boréales',
        ar: 'البحث عن الأضواء الشمالية',
        en: 'Northern Lights Quest',
    },
};

export const bookingTypeLabels: Record<string, LocalizedText> = {
    Destination: { fr: 'Destination', ar: 'وجهة', en: 'Destination' },
    Hotel: { fr: 'Hôtel', ar: 'فندق', en: 'Hotel' },
    Tour: { fr: 'Circuit', ar: 'جولة', en: 'Tour' },
};

export const bookingStatusLabels: Record<string, LocalizedText> = {
    Pending: { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    Confirmed: { fr: 'Confirmé', ar: 'مؤكد', en: 'Confirmed' },
    Cancelled: { fr: 'Annulé', ar: 'ملغي', en: 'Cancelled' },
};

export const teamRoleLabels: Record<string, LocalizedText> = {
    'Founder & CEO': {
        fr: 'Fondatrice & PDG',
        ar: 'المؤسسة والمدير التنفيذي',
        en: 'Founder & CEO',
    },
    'Head of Operations': {
        fr: 'Responsable des opérations',
        ar: 'رئيس العمليات',
        en: 'Head of Operations',
    },
    'Lead Travel Designer': {
        fr: 'Designer Voyage Principal',
        ar: 'مصمم السفر الرئيسي',
        en: 'Lead Travel Designer',
    },
    'Asia-Pacific Director': {
        fr: 'Directeur Asie-Pacifique',
        ar: 'مدير آسيا والمحيط الهادئ',
        en: 'Asia-Pacific Director',
    },
    'Customer Experience': {
        fr: 'Expérience Client',
        ar: 'تجربة العملاء',
        en: 'Customer Experience',
    },
    'Sustainability Lead': {
        fr: 'Responsable Durabilité',
        ar: 'مسؤول الاستدامة',
        en: 'Sustainability Lead',
    },
};

export const teamBioLabels: Record<string, LocalizedText> = {
    '20+ years curating luxury journeys across 80 countries.': {
        fr: 'Plus de 20 ans à concevoir des voyages de luxe dans 80 pays.',
        ar: 'أكثر من 20 عامًا في تنسيق الرحلات الفاخرة عبر 80 دولة.',
        en: '20+ years curating luxury journeys across 80 countries.',
    },
    'Logistics wizard turning dreams into seamless reality.': {
        fr: 'Une experte logistique qui transforme les rêves en réalité fluide.',
        ar: 'خبير لوجستي يحول الأحلام إلى واقع سلس.',
        en: 'Logistics wizard turning dreams into seamless reality.',
    },
    'Crafting unforgettable cultural and adventure itineraries.': {
        fr: 'Création d’itinéraires culturels et d’aventure inoubliables.',
        ar: 'صياغة برامج ثقافية ومغامرات لا تُنسى.',
        en: 'Crafting unforgettable cultural and adventure itineraries.',
    },
    'Local expertise from Tokyo to Bali.': {
        fr: 'Une expertise locale de Tokyo à Bali.',
        ar: 'خبرة محلية من طوكيو إلى بالي.',
        en: 'Local expertise from Tokyo to Bali.',
    },
    'Your dedicated point of contact, every step of the way.': {
        fr: 'Votre interlocutrice dédiée, à chaque étape.',
        ar: 'نقطة الاتصال المخصصة لك في كل خطوة.',
        en: 'Your dedicated point of contact, every step of the way.',
    },
    'Pioneering eco-conscious travel programs worldwide.': {
        fr: 'Pionnier des programmes de voyage écoresponsables dans le monde entier.',
        ar: 'رائد برامج السفر الواعية بيئيًا حول العالم.',
        en: 'Pioneering eco-conscious travel programs worldwide.',
    },
};
