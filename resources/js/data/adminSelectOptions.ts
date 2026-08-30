export type LocalizedOption = {
    value: string;
    label: { en: string; fr: string; ar: string };
};

export type SimpleOption = {
    value: string;
    label: string;
};

// --- Visa Regions ---
export const VISA_REGIONS: LocalizedOption[] = [
    {
        value: 'schengen',
        label: { en: 'Schengen Area', fr: 'Espace Schengen', ar: 'منطقة شنغن' },
    },
    {
        value: 'eu',
        label: {
            en: 'European Union',
            fr: 'Union Européenne',
            ar: 'الاتحاد الأوروبي',
        },
    },
    {
        value: 'gcc',
        label: {
            en: 'Gulf Cooperation Council (GCC)',
            fr: 'Conseil de Coopération du Golfe (CCG)',
            ar: 'مجلس التعاون الخليجي',
        },
    },
    {
        value: 'african_union',
        label: {
            en: 'African Union',
            fr: 'Union Africaine',
            ar: 'الاتحاد الأفريقي',
        },
    },
    { value: 'asean', label: { en: 'ASEAN', fr: 'ASEAN', ar: 'أسيان' } },
    {
        value: 'americas',
        label: { en: 'Americas', fr: 'Amériques', ar: 'الأمريكيتين' },
    },
    {
        value: 'uk',
        label: {
            en: 'United Kingdom',
            fr: 'Royaume-Uni',
            ar: 'المملكة المتحدة',
        },
    },
    { value: 'other', label: { en: 'Other', fr: 'Autre', ar: 'أخرى' } },
];

// --- Flight Trip Types ---
export const FLIGHT_TRIP_TYPES: LocalizedOption[] = [
    {
        value: 'round-trip',
        label: {
            en: 'Round trip',
            fr: 'Aller-retour',
            ar: 'ذهاب وعودة',
        },
    },
    {
        value: 'one-way',
        label: {
            en: 'One-way',
            fr: 'Aller simple',
            ar: 'ذهاب فقط',
        },
    },
    {
        value: 'multi-city',
        label: {
            en: 'Multi-city',
            fr: 'Multi-ville',
            ar: 'عدة مدن',
        },
    },
];

// --- Cabin Classes ---
export const CABIN_CLASSES: LocalizedOption[] = [
    {
        value: 'economy',
        label: { en: 'Economy', fr: 'Économique', ar: 'الاقتصادية' },
    },
    {
        value: 'premium_economy',
        label: {
            en: 'Premium Economy',
            fr: 'Économique Premium',
            ar: 'بريميوم اقتصادية',
        },
    },
    {
        value: 'business',
        label: { en: 'Business', fr: 'Affaires', ar: 'رجال الأعمال' },
    },
    {
        value: 'first',
        label: {
            en: 'First Class',
            fr: 'Première Classe',
            ar: 'الدرجة الأولى',
        },
    },
];

// --- Flight Stops ---
export const FLIGHT_STOPS: LocalizedOption[] = [
    { value: 'direct', label: { en: 'Direct', fr: 'Direct', ar: 'مباشر' } },
    {
        value: '1_stop',
        label: { en: '1 Stop', fr: '1 Escale', ar: 'توقف واحد' },
    },
    {
        value: '2_stops',
        label: { en: '2+ Stops', fr: '2+ Escales', ar: 'توقفان أو أكثر' },
    },
];

// --- Star Ratings ---
export const STAR_RATINGS: SimpleOption[] = [
    { value: '1', label: '1 ★' },
    { value: '2', label: '2 ★★' },
    { value: '3', label: '3 ★★★' },
    { value: '4', label: '4 ★★★★' },
    { value: '5', label: '5 ★★★★★' },
];

// --- Rating Options (0.0 - 5.0) ---
export const RATING_OPTIONS: SimpleOption[] = [
    { value: '0', label: '0' },
    { value: '0.5', label: '0.5' },
    { value: '1', label: '1' },
    { value: '1.5', label: '1.5' },
    { value: '2', label: '2' },
    { value: '2.5', label: '2.5' },
    { value: '3', label: '3' },
    { value: '3.5', label: '3.5' },
    { value: '4', label: '4' },
    { value: '4.5', label: '4.5' },
    { value: '5', label: '5' },
];

// --- Fuel Types ---
export const FUEL_TYPES: LocalizedOption[] = [
    { value: 'petrol', label: { en: 'Petrol', fr: 'Essence', ar: 'بنزين' } },
    { value: 'diesel', label: { en: 'Diesel', fr: 'Diesel', ar: 'ديزل' } },
    {
        value: 'electric',
        label: { en: 'Electric', fr: 'Électrique', ar: 'كهربائي' },
    },
    { value: 'hybrid', label: { en: 'Hybrid', fr: 'Hybride', ar: 'هجين' } },
    { value: 'lpg', label: { en: 'LPG', fr: 'GPL', ar: 'غاز البترول المسال' } },
];

// --- Transmission Types ---
export const TRANSMISSION_TYPES: LocalizedOption[] = [
    {
        value: 'automatic',
        label: { en: 'Automatic', fr: 'Automatique', ar: 'أوتوماتيك' },
    },
    { value: 'manual', label: { en: 'Manual', fr: 'Manuelle', ar: 'يدوي' } },
    {
        value: 'semi_automatic',
        label: {
            en: 'Semi-Automatic',
            fr: 'Semi-Automatique',
            ar: 'شبه أوتوماتيك',
        },
    },
];

// --- Best Time to Visit (Months) ---
export const BEST_TIME_OPTIONS: LocalizedOption[] = [
    { value: 'january', label: { en: 'January', fr: 'Janvier', ar: 'يناير' } },
    {
        value: 'february',
        label: { en: 'February', fr: 'Février', ar: 'فبراير' },
    },
    { value: 'march', label: { en: 'March', fr: 'Mars', ar: 'مارس' } },
    { value: 'april', label: { en: 'April', fr: 'Avril', ar: 'أبريل' } },
    { value: 'may', label: { en: 'May', fr: 'Mai', ar: 'مايو' } },
    { value: 'june', label: { en: 'June', fr: 'Juin', ar: 'يونيو' } },
    { value: 'july', label: { en: 'July', fr: 'Juillet', ar: 'يوليو' } },
    { value: 'august', label: { en: 'August', fr: 'Août', ar: 'أغسطس' } },
    {
        value: 'september',
        label: { en: 'September', fr: 'Septembre', ar: 'سبتمبر' },
    },
    { value: 'october', label: { en: 'October', fr: 'Octobre', ar: 'أكتوبر' } },
    {
        value: 'november',
        label: { en: 'November', fr: 'Novembre', ar: 'نوفمبر' },
    },
    {
        value: 'december',
        label: { en: 'December', fr: 'Décembre', ar: 'ديسمبر' },
    },
    {
        value: 'all_year',
        label: { en: 'All Year', fr: "Toute l'année", ar: 'على مدار السنة' },
    },
];

// --- Languages ---
export const LANGUAGES: LocalizedOption[] = [
    { value: 'arabic', label: { en: 'Arabic', fr: 'Arabe', ar: 'العربية' } },
    {
        value: 'french',
        label: { en: 'French', fr: 'Français', ar: 'الفرنسية' },
    },
    {
        value: 'english',
        label: { en: 'English', fr: 'Anglais', ar: 'الإنجليزية' },
    },
    {
        value: 'spanish',
        label: { en: 'Spanish', fr: 'Espagnol', ar: 'الإسبانية' },
    },
    {
        value: 'german',
        label: { en: 'German', fr: 'Allemand', ar: 'الألمانية' },
    },
    {
        value: 'italian',
        label: { en: 'Italian', fr: 'Italien', ar: 'الإيطالية' },
    },
    {
        value: 'portuguese',
        label: { en: 'Portuguese', fr: 'Portugais', ar: 'البرتغالية' },
    },
    { value: 'russian', label: { en: 'Russian', fr: 'Russe', ar: 'الروسية' } },
    {
        value: 'chinese',
        label: { en: 'Chinese', fr: 'Chinois', ar: 'الصينية' },
    },
    {
        value: 'japanese',
        label: { en: 'Japanese', fr: 'Japonais', ar: 'اليابانية' },
    },
    { value: 'turkish', label: { en: 'Turkish', fr: 'Turc', ar: 'التركية' } },
    {
        value: 'dutch',
        label: { en: 'Dutch', fr: 'Néerlandais', ar: 'الهولندية' },
    },
    { value: 'korean', label: { en: 'Korean', fr: 'Coréen', ar: 'الكورية' } },
    { value: 'hindi', label: { en: 'Hindi', fr: 'Hindi', ar: 'الهندية' } },
    {
        value: 'swahili',
        label: { en: 'Swahili', fr: 'Swahili', ar: 'السواحلية' },
    },
];

// --- Currencies ---
export const CURRENCIES: LocalizedOption[] = [
    {
        value: 'TND',
        label: {
            en: 'Tunisian Dinar (TND)',
            fr: 'Dinar Tunisien (TND)',
            ar: 'الدينار التونسي (TND)',
        },
    },
    {
        value: 'EUR',
        label: { en: 'Euro (EUR)', fr: 'Euro (EUR)', ar: 'اليورو (EUR)' },
    },
    {
        value: 'USD',
        label: {
            en: 'US Dollar (USD)',
            fr: 'Dollar Américain (USD)',
            ar: 'الدولار الأمريكي (USD)',
        },
    },
    {
        value: 'GBP',
        label: {
            en: 'British Pound (GBP)',
            fr: 'Livre Sterling (GBP)',
            ar: 'الجنيه الإسترليني (GBP)',
        },
    },
    {
        value: 'AED',
        label: {
            en: 'UAE Dirham (AED)',
            fr: 'Dirham des EAU (AED)',
            ar: 'درهم الإمارات (AED)',
        },
    },
    {
        value: 'SAR',
        label: {
            en: 'Saudi Riyal (SAR)',
            fr: 'Riyal Saoudien (SAR)',
            ar: 'الريال السعودي (SAR)',
        },
    },
    {
        value: 'CHF',
        label: {
            en: 'Swiss Franc (CHF)',
            fr: 'Franc Suisse (CHF)',
            ar: 'الفرنك السويسري (CHF)',
        },
    },
    {
        value: 'CAD',
        label: {
            en: 'Canadian Dollar (CAD)',
            fr: 'Dollar Canadien (CAD)',
            ar: 'الدولار الكندي (CAD)',
        },
    },
    {
        value: 'AUD',
        label: {
            en: 'Australian Dollar (AUD)',
            fr: 'Dollar Australien (AUD)',
            ar: 'الدولار الأسترالي (AUD)',
        },
    },
    {
        value: 'JPY',
        label: {
            en: 'Japanese Yen (JPY)',
            fr: 'Yen Japonais (JPY)',
            ar: 'الين الياباني (JPY)',
        },
    },
    {
        value: 'TRY',
        label: {
            en: 'Turkish Lira (TRY)',
            fr: 'Lire Turque (TRY)',
            ar: 'الليرة التركية (TRY)',
        },
    },
    {
        value: 'MAD',
        label: {
            en: 'Moroccan Dirham (MAD)',
            fr: 'Dirham Marocain (MAD)',
            ar: 'الدرهم المغربي (MAD)',
        },
    },
    {
        value: 'EGP',
        label: {
            en: 'Egyptian Pound (EGP)',
            fr: 'Livre Égyptienne (EGP)',
            ar: 'الجنيه المصري (EGP)',
        },
    },
    {
        value: 'DZD',
        label: {
            en: 'Algerian Dinar (DZD)',
            fr: 'Dinar Algérien (DZD)',
            ar: 'الدينار الجزائري (DZD)',
        },
    },
];

// --- Weather / Climate Types ---
export const WEATHER_OPTIONS: LocalizedOption[] = [
    {
        value: 'tropical',
        label: { en: 'Tropical', fr: 'Tropical', ar: 'استوائي' },
    },
    {
        value: 'mediterranean',
        label: { en: 'Mediterranean', fr: 'Méditerranéen', ar: 'متوسطي' },
    },
    {
        value: 'desert',
        label: { en: 'Desert', fr: 'Désertique', ar: 'صحراوي' },
    },
    {
        value: 'continental',
        label: { en: 'Continental', fr: 'Continental', ar: 'قاري' },
    },
    {
        value: 'temperate',
        label: { en: 'Temperate', fr: 'Tempéré', ar: 'معتدل' },
    },
    {
        value: 'monsoon',
        label: { en: 'Monsoon', fr: 'Mousson', ar: 'الرياح الموسمية' },
    },
    { value: 'arid', label: { en: 'Arid', fr: 'Aride', ar: 'جاف' } },
    { value: 'oceanic', label: { en: 'Oceanic', fr: 'Océanique', ar: 'بحري' } },
    { value: 'polar', label: { en: 'Polar', fr: 'Polaire', ar: 'قطبي' } },
    {
        value: 'subtropical',
        label: { en: 'Subtropical', fr: 'Subtropical', ar: 'شبه استوائي' },
    },
];

// --- Airlines ---
export const AIRLINE_NAMES: LocalizedOption[] = [
    {
        value: 'tunisair',
        label: { en: 'Tunisair', fr: 'Tunisair', ar: 'الخطوط التونسية' },
    },
    {
        value: 'air_france',
        label: {
            en: 'Air France',
            fr: 'Air France',
            ar: 'الخطوط الجوية الفرنسية',
        },
    },
    {
        value: 'emirates',
        label: { en: 'Emirates', fr: 'Emirates', ar: 'طيران الإمارات' },
    },
    {
        value: 'qatar_airways',
        label: {
            en: 'Qatar Airways',
            fr: 'Qatar Airways',
            ar: 'الخطوط الجوية القطرية',
        },
    },
    {
        value: 'turkish_airlines',
        label: {
            en: 'Turkish Airlines',
            fr: 'Turkish Airlines',
            ar: 'الخطوط الجوية التركية',
        },
    },
    {
        value: 'royal_air_maroc',
        label: {
            en: 'Royal Air Maroc',
            fr: 'Royal Air Maroc',
            ar: 'الخطوط الملكية المغربية',
        },
    },
    {
        value: 'egyptair',
        label: { en: 'EgyptAir', fr: 'EgyptAir', ar: 'مصر للطيران' },
    },
    {
        value: 'saudi_arabian_airlines',
        label: {
            en: 'Saudia',
            fr: 'Saudia',
            ar: 'الخطوط الجوية العربية السعودية',
        },
    },
    {
        value: 'lufthansa',
        label: { en: 'Lufthansa', fr: 'Lufthansa', ar: 'لوفتهانزا' },
    },
    {
        value: 'british_airways',
        label: {
            en: 'British Airways',
            fr: 'British Airways',
            ar: 'الخطوط الجوية البريطانية',
        },
    },
    { value: 'klm', label: { en: 'KLM', fr: 'KLM', ar: 'ك إل إم' } },
    {
        value: 'italy_airways',
        label: { en: 'ITA Airways', fr: 'ITA Airways', ar: 'إيطاليا للطيران' },
    },
    { value: 'iberia', label: { en: 'Iberia', fr: 'Iberia', ar: 'إيبيريا' } },
    {
        value: 'ryanair',
        label: { en: 'Ryanair', fr: 'Ryanair', ar: 'رايان إير' },
    },
    {
        value: 'easyjet',
        label: { en: 'EasyJet', fr: 'EasyJet', ar: 'إيزي جيت' },
    },
    { value: 'swiss', label: { en: 'Swiss', fr: 'Swiss', ar: 'السويسرية' } },
    {
        value: 'ethiopian_airlines',
        label: {
            en: 'Ethiopian Airlines',
            fr: 'Ethiopian Airlines',
            ar: 'الخطوط الجوية الإثيوبية',
        },
    },
    {
        value: 'saudia',
        label: { en: 'Saudia', fr: 'Saudia', ar: 'طيران السعودية' },
    },
    {
        value: 'kuwait_airways',
        label: {
            en: 'Kuwait Airways',
            fr: 'Kuwait Airways',
            ar: 'الخطوط الجوية الكويتية',
        },
    },
    {
        value: 'gulf_air',
        label: { en: 'Gulf Air', fr: 'Gulf Air', ar: 'طيران الخليج' },
    },
];

// --- Helper to get localized label ---
export function getLocalizedLabel(
    option: LocalizedOption,
    lang: 'en' | 'fr' | 'ar',
): string {
    return option.label[lang] || option.label.en;
}
