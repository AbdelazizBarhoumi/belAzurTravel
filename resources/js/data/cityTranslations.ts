/**
 * City name translations for tour destinations.
 * Key = English city name (stored in DB), Value = translations.
 *
 * Add cities as needed. Only cities used in tours need entries.
 * Cities not in this map will fall back to their English name.
 */

export const cityTranslations: Record<string, { fr: string; ar: string }> = {
    // Tunisia
    'Tunis': { fr: 'Tunis', ar: 'تونس' },
    'Sousse': { fr: 'Sousse', ar: 'سوسة' },
    'Sfax': { fr: 'Sfax', ar: 'صفاقس' },
    'Djerba': { fr: 'Djerba', ar: 'جربة' },
    'Tozeur': { fr: 'Tozeur', ar: 'توزر' },
    'Gabes': { fr: 'Gabès', ar: 'قابس' },
    'Hammamet': { fr: 'Hammamet', ar: 'الحمامات' },
    'Monastir': { fr: 'Monastir', ar: 'المنستير' },
    'Mahdia': { fr: 'Mahdia', ar: 'المهدية' },
    'Kairouan': { fr: 'Kairouan', ar: 'القيروان' },
    'Bizerte': { fr: 'Bizerte', ar: 'بنزرت' },

    // Popular international destinations
    'Bali': { fr: 'Bali', ar: 'بالي' },
    'Paris': { fr: 'Paris', ar: 'باريس' },
    'London': { fr: 'Londres', ar: 'لندن' },
    'Rome': { fr: 'Rome', ar: 'روما' },
    'Barcelona': { fr: 'Barcelone', ar: 'برشلونة' },
    'Istanbul': { fr: 'Istanbul', ar: 'إسطنبول' },
    'Dubai': { fr: 'Dubaï', ar: 'دبي' },
    'Marrakech': { fr: 'Marrakech', ar: 'مراكش' },
    'Cairo': { fr: 'Le Caire', ar: 'القاهرة' },
    'Tokyo': { fr: 'Tokyo', ar: 'طوكيو' },
    'Bangkok': { fr: 'Bangkok', ar: 'بانكوك' },
    'New York': { fr: 'New York', ar: 'نيويورك' },
    'Santorini': { fr: 'Santorin', ar: 'سانتوريني' },
    'Prague': { fr: 'Prague', ar: 'براغ' },
    'Amsterdam': { fr: 'Amsterdam', ar: 'أمستردام' },
    'Madrid': { fr: 'Madrid', ar: 'مدريد' },
    'Berlin': { fr: 'Berlin', ar: 'برلين' },
    'Vienna': { fr: 'Vienne', ar: 'فيينا' },
    'Lisbon': { fr: 'Lisbonne', ar: 'لشبونة' },
    'Sydney': { fr: 'Sydney', ar: 'سيدني' },
    'Singapore': { fr: 'Singapour', ar: 'سنغافورة' },
    'Kuala Lumpur': { fr: 'Kuala Lumpur', ar: 'كوالالمبور' },
    'Seoul': { fr: 'Séoul', ar: 'سيول' },
    'Mumbai': { fr: 'Mumbai', ar: 'مومباي' },
    'Rio de Janeiro': { fr: 'Rio de Janeiro', ar: 'ريو دي جانيرو' },
    'Cancun': { fr: 'Cancún', ar: 'كانكون' },
    'Maldives': { fr: 'Maldives', ar: 'المالديف' },
    'Phuket': { fr: 'Phuket', ar: 'بوكيت' },
    'Mykonos': { fr: 'Mykonos', ar: 'ميكونوس' },
    'Zanzibar': { fr: 'Zanzibar', ar: 'زنجبار' },
    'Mauritius': { fr: 'Île Maurice', ar: 'موريشيوس' },
    'Reunion': { fr: 'La Réunion', ar: 'ريونيون' },
};

/**
 * Get localized city name. Falls back to English if no translation exists.
 */
export function getLocalizedName(
    englishName: string,
    lang: 'en' | 'fr' | 'ar',
): string {
    if (lang === 'en') return englishName;
    const translations = cityTranslations[englishName];
    if (!translations) return englishName;
    return translations[lang] || englishName;
}
