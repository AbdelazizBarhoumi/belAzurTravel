/**
 * Hardcoded locations (countries + cities) used by the location picker across
 * the system. Replaces the `country-state-city` and `i18n-iso-countries`
 * packages. Every name is mapped in the 3 languages (en/fr/ar).
 *
 * Countries cover the whole world (see `countries.json`); cities start from
 * the OS-TRAVEL catalog (Tunisia, Turkey, Algeria) plus popular destinations.
 */

import countriesData from './countries.json';
import tunisiaTowns from './tunisiaCities.json';

export interface LocalizedName {
    en: string;
    fr: string;
    ar: string;
}

export interface CountryItem {
    code: string;
    name: LocalizedName;
    /** OS-TRAVEL provider id (present only for the provider's countries). */
    ostravelId?: number;
}

export interface CityItem {
    name: LocalizedName;
    countryCode: string;
    /** OS-TRAVEL provider id (present only for the provider's cities). */
    ostravelId?: number;
    /** Tunisian governorate key (see `TN_GOVERNORATES`). */
    region?: string;
}

const n = (en: string, fr: string, ar: string): LocalizedName => ({
    en,
    fr,
    ar,
});

/**
 * Every ISO-3166 country (250) with en/fr/ar names, generated once from the
 * i18n-iso-countries dataset; hand-curated names and OS-TRAVEL ids were kept.
 * Shared with the backend (`App\Support\CountryNames`).
 */
export const COUNTRIES: CountryItem[] = (
    countriesData as Array<{
        code: string;
        en: string;
        fr: string;
        ar: string;
        ostravelId?: number;
    }>
)
    .map(({ code, en, fr, ar, ostravelId }) => ({
        code,
        name: n(en, fr, ar),
        ...(ostravelId != null ? { ostravelId } : {}),
    }))
    // Tunisia (home market) first, then alphabetical.
    .sort((a, b) =>
        a.code === 'TN'
            ? -1
            : b.code === 'TN'
              ? 1
              : a.name.fr.localeCompare(b.name.fr, 'fr'),
    );

const BASE_CITIES: CityItem[] = [
    // Tunisia
    { name: n('Tunis', 'Tunis', 'تونس'), countryCode: 'TN', ostravelId: 32 },
    { name: n('Sousse', 'Sousse', 'سوسة'), countryCode: 'TN', ostravelId: 34 },
    { name: n('Sfax', 'Sfax', 'صفاقس'), countryCode: 'TN', ostravelId: 39 },
    { name: n('Djerba', 'Djerba', 'جربة'), countryCode: 'TN', ostravelId: 18 },
    { name: n('Tozeur', 'Tozeur', 'توزر'), countryCode: 'TN', ostravelId: 47 },
    { name: n('Gabes', 'Gabès', 'قابس'), countryCode: 'TN', ostravelId: 55 },
    {
        name: n('Hammamet', 'Hammamet', 'الحمامات'),
        countryCode: 'TN',
        ostravelId: 10,
    },
    {
        name: n('Yasmine Hammamet', 'Yasmine Hammamet', 'ياسمين الحمامات'),
        countryCode: 'TN',
    },
    {
        name: n('Monastir', 'Monastir', 'المنستير'),
        countryCode: 'TN',
        ostravelId: 37,
    },
    {
        name: n('Mahdia', 'Mahdia', 'المهدية'),
        countryCode: 'TN',
        ostravelId: 35,
    },
    {
        name: n('Kairouan', 'Kairouan', 'القيروان'),
        countryCode: 'TN',
        ostravelId: 17,
    },
    {
        name: n('Bizerte', 'Bizerte', 'بنزرت'),
        countryCode: 'TN',
        ostravelId: 48,
    },
    {
        name: n('Ain Drahem', 'Ain Drahem', 'عين دراهم'),
        countryCode: 'TN',
        ostravelId: 31,
    },
    { name: n('Béja', 'Béja', 'باجة'), countryCode: 'TN', ostravelId: 6487 },
    { name: n('Douz', 'Douz', 'دوز'), countryCode: 'TN', ostravelId: 20 },
    {
        name: n('El Jem', 'El Jem', 'الجم'),
        countryCode: 'TN',
        ostravelId: 6482,
    },
    { name: n('Gafsa', 'Gafsa', 'قفصة'), countryCode: 'TN', ostravelId: 54 },
    {
        name: n('Gammarth', 'Gammarth', 'قمرت'),
        countryCode: 'TN',
        ostravelId: 6485,
    },
    { name: n('Kebili', 'Kébili', 'قبلي'), countryCode: 'TN', ostravelId: 22 },
    {
        name: n('Kelibia', 'Kélibia', 'قليبية'),
        countryCode: 'TN',
        ostravelId: 12,
    },
    {
        name: n('Kerkennah', 'Kerkennah', 'قرقنة'),
        countryCode: 'TN',
        ostravelId: 6483,
    },
    { name: n('Korba', 'Korba', 'قربة'), countryCode: 'TN', ostravelId: 13 },
    {
        name: n('Korbous', 'Korbous', 'قربص'),
        countryCode: 'TN',
        ostravelId: 14,
    },
    {
        name: n('Ksar Ghilane', 'Ksar Ghilane', 'قصر غيلان'),
        countryCode: 'TN',
        ostravelId: 23,
    },
    { name: n('Le Kef', 'Le Kef', 'الكاف'), countryCode: 'TN', ostravelId: 49 },
    {
        name: n('Matmata', 'Matmata', 'مطماطة'),
        countryCode: 'TN',
        ostravelId: 73,
    },
    {
        name: n('Mednenine', 'Médenine', 'مدنين'),
        countryCode: 'TN',
        ostravelId: 76,
    },
    { name: n('Nabeul', 'Nabeul', 'نابل'), countryCode: 'TN', ostravelId: 11 },
    { name: n('Nefta', 'Nefta', 'نفطة'), countryCode: 'TN', ostravelId: 75 },
    { name: n('Nefza', 'Nefza', 'نفزة'), countryCode: 'TN', ostravelId: 6484 },
    {
        name: n('Sbeitla', 'Sbeïtla', 'سبيطلة'),
        countryCode: 'TN',
        ostravelId: 72,
    },
    {
        name: n('Sidi Bouzid', 'Sidi Bouzid', 'سيدي بوزيد'),
        countryCode: 'TN',
        ostravelId: 74,
    },
    {
        name: n('Tabarka', 'Tabarka', 'طبرقة'),
        countryCode: 'TN',
        ostravelId: 33,
    },
    {
        name: n('Tataouine', 'Tataouine', 'تطاوين'),
        countryCode: 'TN',
        ostravelId: 70,
    },
    {
        name: n('Téboursouk', 'Téboursouk', 'تبرسق'),
        countryCode: 'TN',
        ostravelId: 71,
    },
    {
        name: n('Zaghouan', 'Zaghouan', 'زغوان'),
        countryCode: 'TN',
        ostravelId: 59,
    },
    { name: n('Zarzis', 'Zarzis', 'جرجيس'), countryCode: 'TN', ostravelId: 19 },
    // Turkey
    {
        name: n('Istanbul', 'Istanbul', 'إسطنبول'),
        countryCode: 'TR',
        ostravelId: 6488,
    },
    {
        name: n(
            'Esenyurt - Istanbul',
            'Esenyurt - Istanbul',
            'أسن يورت - إسطنبول',
        ),
        countryCode: 'TR',
        ostravelId: 6489,
    },
    { name: n('Antalya', 'Antalya', 'أنطاليا'), countryCode: 'TR' },
    { name: n('Cappadocia', 'Cappadoce', 'كابادوكيا'), countryCode: 'TR' },
    // France
    { name: n('Paris', 'Paris', 'باريس'), countryCode: 'FR' },
    // Italy
    { name: n('Rome', 'Rome', 'روما'), countryCode: 'IT' },
    // Spain
    { name: n('Barcelona', 'Barcelone', 'برشلونة'), countryCode: 'ES' },
    { name: n('Madrid', 'Madrid', 'مدريد'), countryCode: 'ES' },
    // Morocco
    { name: n('Marrakech', 'Marrakech', 'مراكش'), countryCode: 'MA' },
    // UAE
    { name: n('Dubai', 'Dubaï', 'دبي'), countryCode: 'AE' },
    { name: n('Abu Dhabi', 'Abou Dabi', 'أبو ظبي'), countryCode: 'AE' },
    // Egypt
    { name: n('Cairo', 'Le Caire', 'القاهرة'), countryCode: 'EG' },
    // Indonesia
    { name: n('Bali', 'Bali', 'بالي'), countryCode: 'ID' },
    { name: n('Ubud', 'Ubud', 'أوبود'), countryCode: 'ID' },
    // Thailand
    { name: n('Bangkok', 'Bangkok', 'بانكوك'), countryCode: 'TH' },
    { name: n('Phuket', 'Phuket', 'بوكيت'), countryCode: 'TH' },
    // Germany
    { name: n('Berlin', 'Berlin', 'برلين'), countryCode: 'DE' },
    // United Kingdom
    { name: n('London', 'Londres', 'لندن'), countryCode: 'GB' },
    // United States
    { name: n('New York', 'New York', 'نيويورك'), countryCode: 'US' },
    // Japan
    { name: n('Tokyo', 'Tokyo', 'طوكيو'), countryCode: 'JP' },
    // Saudi Arabia
    { name: n('Mecca', 'La Mecque', 'مكة المكرمة'), countryCode: 'SA' },
    { name: n('Medina', 'Médine', 'المدينة المنورة'), countryCode: 'SA' },
    // Malaysia
    {
        name: n('Kuala Lumpur', 'Kuala Lumpur', 'كوالالمبور'),
        countryCode: 'MY',
    },
    // Australia
    { name: n('Sydney', 'Sydney', 'سيدني'), countryCode: 'AU' },
    // India
    { name: n('Mumbai', 'Mumbai', 'مومباي'), countryCode: 'IN' },
    // South Korea
    { name: n('Seoul', 'Séoul', 'سيول'), countryCode: 'KR' },
    // Brazil
    {
        name: n('Rio de Janeiro', 'Rio de Janeiro', 'ريو دي جانيرو'),
        countryCode: 'BR',
    },
    // Tanzania
    { name: n('Zanzibar', 'Zanzibar', 'زنجبار'), countryCode: 'TZ' },
    // Mauritius
    { name: n('Mauritius', 'Île Maurice', 'موريشيوس'), countryCode: 'MU' },
    // Réunion
    { name: n('Réunion', 'La Réunion', 'ريونيون'), countryCode: 'RE' },
    // Greece
    { name: n('Santorini', 'Santorin', 'سانتوريني'), countryCode: 'GR' },
    { name: n('Mykonos', 'Mykonos', 'ميكونوس'), countryCode: 'GR' },
    // Czech Republic
    { name: n('Prague', 'Prague', 'براغ'), countryCode: 'CZ' },
    // Netherlands
    { name: n('Amsterdam', 'Amsterdam', 'أمستردام'), countryCode: 'NL' },
    // Portugal
    { name: n('Lisbon', 'Lisbonne', 'لشبونة'), countryCode: 'PT' },
    // Austria
    { name: n('Vienna', 'Vienne', 'فيينا'), countryCode: 'AT' },
    // Maldives
    { name: n('Maldives', 'Maldives', 'المالديف'), countryCode: 'MV' },
    // Singapore
    { name: n('Singapore', 'Singapour', 'سنغافورة'), countryCode: 'SG' },
    // Mexico
    { name: n('Cancun', 'Cancún', 'كانكون'), countryCode: 'MX' },
];

/** The 24 Tunisian governorates, used to group the Tunisian cities. */
export const TN_GOVERNORATES: Record<string, LocalizedName> = {
    tunis: n('Tunis', 'Tunis', 'تونس'),
    ariana: n('Ariana', 'Ariana', 'أريانة'),
    'ben-arous': n('Ben Arous', 'Ben Arous', 'بن عروس'),
    manouba: n('Manouba', 'La Manouba', 'منوبة'),
    nabeul: n('Nabeul', 'Nabeul', 'نابل'),
    zaghouan: n('Zaghouan', 'Zaghouan', 'زغوان'),
    bizerte: n('Bizerte', 'Bizerte', 'بنزرت'),
    beja: n('Beja', 'Béja', 'باجة'),
    jendouba: n('Jendouba', 'Jendouba', 'جندوبة'),
    kef: n('Kef', 'Le Kef', 'الكاف'),
    siliana: n('Siliana', 'Siliana', 'سليانة'),
    sousse: n('Sousse', 'Sousse', 'سوسة'),
    monastir: n('Monastir', 'Monastir', 'المنستير'),
    mahdia: n('Mahdia', 'Mahdia', 'المهدية'),
    sfax: n('Sfax', 'Sfax', 'صفاقس'),
    kairouan: n('Kairouan', 'Kairouan', 'القيروان'),
    kasserine: n('Kasserine', 'Kasserine', 'القصرين'),
    'sidi-bouzid': n('Sidi Bouzid', 'Sidi Bouzid', 'سيدي بوزيد'),
    gabes: n('Gabes', 'Gabès', 'قابس'),
    medenine: n('Medenine', 'Médenine', 'مدنين'),
    tataouine: n('Tataouine', 'Tataouine', 'تطاوين'),
    gafsa: n('Gafsa', 'Gafsa', 'قفصة'),
    tozeur: n('Tozeur', 'Tozeur', 'توزر'),
    kebili: n('Kebili', 'Kébili', 'قبلي'),
};

// Governorate of each hand-curated Tunisian city (keyed by English name).
const CURATED_TN_REGIONS: Record<string, string> = {
    Tunis: 'tunis',
    Gammarth: 'tunis',
    Sousse: 'sousse',
    Sfax: 'sfax',
    Kerkennah: 'sfax',
    Djerba: 'medenine',
    Mednenine: 'medenine',
    Zarzis: 'medenine',
    Tozeur: 'tozeur',
    Nefta: 'tozeur',
    Gabes: 'gabes',
    Matmata: 'gabes',
    Hammamet: 'nabeul',
    'Yasmine Hammamet': 'nabeul',
    Nabeul: 'nabeul',
    Kelibia: 'nabeul',
    Korba: 'nabeul',
    Korbous: 'nabeul',
    Monastir: 'monastir',
    Mahdia: 'mahdia',
    'El Jem': 'mahdia',
    Kairouan: 'kairouan',
    Bizerte: 'bizerte',
    'Ain Drahem': 'jendouba',
    Tabarka: 'jendouba',
    'Béja': 'beja',
    Nefza: 'beja',
    'Téboursouk': 'beja',
    Douz: 'kebili',
    Kebili: 'kebili',
    'Ksar Ghilane': 'kebili',
    Gafsa: 'gafsa',
    'Le Kef': 'kef',
    Sbeitla: 'kasserine',
    'Sidi Bouzid': 'sidi-bouzid',
    Tataouine: 'tataouine',
    Zaghouan: 'zaghouan',
};

/**
 * All cities: the curated list (provider ids kept) plus every other Tunisian
 * town with more than 1,000 inhabitants (GeoNames), grouped by governorate.
 */
export const CITIES: CityItem[] = [
    ...BASE_CITIES.map((city) =>
        city.countryCode === 'TN' && CURATED_TN_REGIONS[city.name.en]
            ? { ...city, region: CURATED_TN_REGIONS[city.name.en] }
            : city,
    ),
    ...(
        tunisiaTowns as Array<{ en: string; fr: string; ar: string; gov: string }>
    ).map(({ en, fr, ar, gov }) => ({
        name: n(en, fr, ar),
        countryCode: 'TN',
        region: gov,
    })),
];

export function getCountries(): CountryItem[] {
    return COUNTRIES;
}

export function getCitiesByCountry(countryCode: string | null): CityItem[] {
    if (!countryCode) return CITIES;
    return CITIES.filter((city) => city.countryCode === countryCode);
}

export function findCountryByCodeOrEnglishName(
    value: string,
): CountryItem | undefined {
    return COUNTRIES.find(
        (country) => country.code === value || country.name.en === value,
    );
}

export function findCityByEnglishName(name: string): CityItem | undefined {
    return CITIES.find(
        (city) =>
            city.name.en === name ||
            city.name.fr === name ||
            city.name.ar === name,
    );
}

export function getLocalizedName(
    englishName: string,
    lang: 'en' | 'fr' | 'ar',
): string {
    if (lang === 'en') return englishName;
    const city = findCityByEnglishName(englishName);
    if (!city) return englishName;
    return city.name[lang] || englishName;
}

/** Countries that belong to the OS-TRAVEL provider catalog (have a provider id). */
export function getOstravelCountries(): CountryItem[] {
    return COUNTRIES.filter((country) => country.ostravelId != null);
}

/** OS-TRAVEL provider cities, optionally narrowed to one provider country. */
export function getOstravelCities(
    countryOstravelId?: string | number | null,
): CityItem[] {
    let cities = CITIES.filter((city) => city.ostravelId != null);
    if (countryOstravelId != null && countryOstravelId !== '') {
        const country = COUNTRIES.find(
            (c) => c.ostravelId === Number(countryOstravelId),
        );
        if (country) {
            cities = cities.filter((city) => city.countryCode === country.code);
        }
    }
    return cities;
}

export function findCountryByOstravelId(
    id: string | number,
): CountryItem | undefined {
    return COUNTRIES.find((country) => country.ostravelId === Number(id));
}

export function findCityByOstravelId(
    id: string | number,
): CityItem | undefined {
    return CITIES.find((city) => city.ostravelId === Number(id));
}
