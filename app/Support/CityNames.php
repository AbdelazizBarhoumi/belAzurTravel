<?php

namespace App\Support;

/**
 * Canonical 3-language city names, kept in sync with the hardcoded
 * `resources/js/data/locations.ts` list. Used to normalize provider-written
 * city fields that repeat a single name across every language slot (e.g.
 * `{en: 'Kelibia', fr: 'Kelibia', ar: 'Kelibia'}`) back to the canonical
 * localized form (`{en: 'Kelibia', fr: 'Kélibia', ar: 'قليبية'}`).
 */
class CityNames
{
    /** @var array<string, array{en: string, fr: string, ar: string}> keyed by English name */
    private const CITIES = [
        // Tunisia
        'Tunis' => ['en' => 'Tunis', 'fr' => 'Tunis', 'ar' => 'تونس'],
        'Sousse' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
        'Sfax' => ['en' => 'Sfax', 'fr' => 'Sfax', 'ar' => 'صفاقس'],
        'Djerba' => ['en' => 'Djerba', 'fr' => 'Djerba', 'ar' => 'جربة'],
        'Tozeur' => ['en' => 'Tozeur', 'fr' => 'Tozeur', 'ar' => 'توزر'],
        'Gabes' => ['en' => 'Gabes', 'fr' => 'Gabès', 'ar' => 'قابس'],
        'Hammamet' => ['en' => 'Hammamet', 'fr' => 'Hammamet', 'ar' => 'الحمامات'],
        'Yasmine Hammamet' => ['en' => 'Yasmine Hammamet', 'fr' => 'Yasmine Hammamet', 'ar' => 'ياسمين الحمامات'],
        'Monastir' => ['en' => 'Monastir', 'fr' => 'Monastir', 'ar' => 'المنستير'],
        'Mahdia' => ['en' => 'Mahdia', 'fr' => 'Mahdia', 'ar' => 'المهدية'],
        'Kairouan' => ['en' => 'Kairouan', 'fr' => 'Kairouan', 'ar' => 'القيروان'],
        'Bizerte' => ['en' => 'Bizerte', 'fr' => 'Bizerte', 'ar' => 'بنزرت'],
        'Ain Drahem' => ['en' => 'Ain Drahem', 'fr' => 'Ain Drahem', 'ar' => 'عين دراهم'],
        'Béja' => ['en' => 'Béja', 'fr' => 'Béja', 'ar' => 'باجة'],
        'Douz' => ['en' => 'Douz', 'fr' => 'Douz', 'ar' => 'دوز'],
        'El Jem' => ['en' => 'El Jem', 'fr' => 'El Jem', 'ar' => 'الجم'],
        'Gafsa' => ['en' => 'Gafsa', 'fr' => 'Gafsa', 'ar' => 'قفصة'],
        'Gammarth' => ['en' => 'Gammarth', 'fr' => 'Gammarth', 'ar' => 'قمرت'],
        'Kebili' => ['en' => 'Kebili', 'fr' => 'Kébili', 'ar' => 'قبلي'],
        'Kelibia' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
        'Kerkennah' => ['en' => 'Kerkennah', 'fr' => 'Kerkennah', 'ar' => 'قرقنة'],
        'Korba' => ['en' => 'Korba', 'fr' => 'Korba', 'ar' => 'قربة'],
        'Korbous' => ['en' => 'Korbous', 'fr' => 'Korbous', 'ar' => 'قربص'],
        'Ksar Ghilane' => ['en' => 'Ksar Ghilane', 'fr' => 'Ksar Ghilane', 'ar' => 'قصر غيلان'],
        'Le Kef' => ['en' => 'Le Kef', 'fr' => 'Le Kef', 'ar' => 'الكاف'],
        'Matmata' => ['en' => 'Matmata', 'fr' => 'Matmata', 'ar' => 'مطماطة'],
        'Mednenine' => ['en' => 'Mednenine', 'fr' => 'Médenine', 'ar' => 'مدنين'],
        'Nabeul' => ['en' => 'Nabeul', 'fr' => 'Nabeul', 'ar' => 'نابل'],
        'Nefta' => ['en' => 'Nefta', 'fr' => 'Nefta', 'ar' => 'نفطة'],
        'Nefza' => ['en' => 'Nefza', 'fr' => 'Nefza', 'ar' => 'نفزة'],
        'Sbeitla' => ['en' => 'Sbeitla', 'fr' => 'Sbeïtla', 'ar' => 'سبيطلة'],
        'Sidi Bouzid' => ['en' => 'Sidi Bouzid', 'fr' => 'Sidi Bouzid', 'ar' => 'سيدي بوزيد'],
        'Tabarka' => ['en' => 'Tabarka', 'fr' => 'Tabarka', 'ar' => 'طبرقة'],
        'Tataouine' => ['en' => 'Tataouine', 'fr' => 'Tataouine', 'ar' => 'تطاوين'],
        'Téboursouk' => ['en' => 'Téboursouk', 'fr' => 'Téboursouk', 'ar' => 'تبرسق'],
        'Zaghouan' => ['en' => 'Zaghouan', 'fr' => 'Zaghouan', 'ar' => 'زغوان'],
        'Zarzis' => ['en' => 'Zarzis', 'fr' => 'Zarzis', 'ar' => 'جرجيس'],
        // Turkey
        'Istanbul' => ['en' => 'Istanbul', 'fr' => 'Istanbul', 'ar' => 'إسطنبول'],
        'Esenyurt - Istanbul' => ['en' => 'Esenyurt - Istanbul', 'fr' => 'Esenyurt - Istanbul', 'ar' => 'أسن يورت - إسطنبول'],
        'Antalya' => ['en' => 'Antalya', 'fr' => 'Antalya', 'ar' => 'أنطاليا'],
        'Cappadocia' => ['en' => 'Cappadocia', 'fr' => 'Cappadoce', 'ar' => 'كابادوكيا'],
        // France
        'Paris' => ['en' => 'Paris', 'fr' => 'Paris', 'ar' => 'باريس'],
        // Italy
        'Rome' => ['en' => 'Rome', 'fr' => 'Rome', 'ar' => 'روما'],
        // Spain
        'Barcelona' => ['en' => 'Barcelona', 'fr' => 'Barcelone', 'ar' => 'برشلونة'],
        'Madrid' => ['en' => 'Madrid', 'fr' => 'Madrid', 'ar' => 'مدريد'],
        // Morocco
        'Marrakech' => ['en' => 'Marrakech', 'fr' => 'Marrakech', 'ar' => 'مراكش'],
        // UAE
        'Dubai' => ['en' => 'Dubai', 'fr' => 'Dubaï', 'ar' => 'دبي'],
        'Abu Dhabi' => ['en' => 'Abu Dhabi', 'fr' => 'Abou Dabi', 'ar' => 'أبو ظبي'],
        // Egypt
        'Cairo' => ['en' => 'Cairo', 'fr' => 'Le Caire', 'ar' => 'القاهرة'],
        // Indonesia
        'Bali' => ['en' => 'Bali', 'fr' => 'Bali', 'ar' => 'بالي'],
        'Ubud' => ['en' => 'Ubud', 'fr' => 'Ubud', 'ar' => 'أوبود'],
        // Thailand
        'Bangkok' => ['en' => 'Bangkok', 'fr' => 'Bangkok', 'ar' => 'بانكوك'],
        'Phuket' => ['en' => 'Phuket', 'fr' => 'Phuket', 'ar' => 'بوكيت'],
        // Germany
        'Berlin' => ['en' => 'Berlin', 'fr' => 'Berlin', 'ar' => 'برلين'],
        // United Kingdom
        'London' => ['en' => 'London', 'fr' => 'Londres', 'ar' => 'لندن'],
        // United States
        'New York' => ['en' => 'New York', 'fr' => 'New York', 'ar' => 'نيويورك'],
        // Japan
        'Tokyo' => ['en' => 'Tokyo', 'fr' => 'Tokyo', 'ar' => 'طوكيو'],
        // Saudi Arabia
        'Mecca' => ['en' => 'Mecca', 'fr' => 'La Mecque', 'ar' => 'مكة المكرمة'],
        'Medina' => ['en' => 'Medina', 'fr' => 'Médine', 'ar' => 'المدينة المنورة'],
        // Malaysia
        'Kuala Lumpur' => ['en' => 'Kuala Lumpur', 'fr' => 'Kuala Lumpur', 'ar' => 'كوالالمبور'],
        // Australia
        'Sydney' => ['en' => 'Sydney', 'fr' => 'Sydney', 'ar' => 'سيدني'],
        // India
        'Mumbai' => ['en' => 'Mumbai', 'fr' => 'Mumbai', 'ar' => 'مومباي'],
        // South Korea
        'Seoul' => ['en' => 'Seoul', 'fr' => 'Séoul', 'ar' => 'سيول'],
        // Brazil
        'Rio de Janeiro' => ['en' => 'Rio de Janeiro', 'fr' => 'Rio de Janeiro', 'ar' => 'ريو دي جانيرو'],
        // Tanzania
        'Zanzibar' => ['en' => 'Zanzibar', 'fr' => 'Zanzibar', 'ar' => 'زنجبار'],
        // Mauritius
        'Mauritius' => ['en' => 'Mauritius', 'fr' => 'Île Maurice', 'ar' => 'موريشيوس'],
        // Réunion
        'Réunion' => ['en' => 'Réunion', 'fr' => 'La Réunion', 'ar' => 'ريونيون'],
        // Greece
        'Santorini' => ['en' => 'Santorini', 'fr' => 'Santorin', 'ar' => 'سانتوريني'],
        'Mykonos' => ['en' => 'Mykonos', 'fr' => 'Mykonos', 'ar' => 'ميكونوس'],
        // Czech Republic
        'Prague' => ['en' => 'Prague', 'fr' => 'Prague', 'ar' => 'براغ'],
        // Netherlands
        'Amsterdam' => ['en' => 'Amsterdam', 'fr' => 'Amsterdam', 'ar' => 'أمستردام'],
        // Portugal
        'Lisbon' => ['en' => 'Lisbon', 'fr' => 'Lisbonne', 'ar' => 'لشبونة'],
        // Austria
        'Vienna' => ['en' => 'Vienna', 'fr' => 'Vienne', 'ar' => 'فيينا'],
        // Maldives
        'Maldives' => ['en' => 'Maldives', 'fr' => 'Maldives', 'ar' => 'المالديف'],
        // Singapore
        'Singapore' => ['en' => 'Singapore', 'fr' => 'Singapour', 'ar' => 'سنغافورة'],
    ];

    /** @var array<string, string> normalized name variant -> English key */
    private static ?array $aliasIndex = null;

    private static function index(): array
    {
        if (self::$aliasIndex !== null) {
            return self::$aliasIndex;
        }

        $index = [];
        foreach (self::CITIES as $key => $names) {
            foreach ($names as $name) {
                if ($name !== '') {
                    $index[CountryNames::key($name)] = $key;
                }
            }
        }

        return self::$aliasIndex = $index;
    }

    /**
     * Resolve any known city name variant to the canonical 3-language form,
     * or null when the value cannot be matched.
     *
     * @return array{en: string, fr: string, ar: string}|null
     */
    public static function canonical(string $name): ?array
    {
        $key = self::index()[CountryNames::key($name)] ?? null;

        return $key !== null ? self::CITIES[$key] : null;
    }

    /**
     * Normalize a stored `city` (or plain city-name `location`) field. Given a
     * provider-written object that repeats a single name across all three
     * slots, every slot is rewritten to the canonical localized form. Returns
     * null when nothing matches (e.g. a free-form address).
     *
     * @param  array{en?: string, fr?: string, ar?: string}|mixed  $city
     * @return array{en: string, fr: string, ar: string}|null
     */
    public static function normalize(?array $city): ?array
    {
        if (! is_array($city)) {
            return null;
        }

        $candidates = array_values(array_filter([
            $city['en'] ?? '',
            $city['fr'] ?? '',
            $city['ar'] ?? '',
        ], fn (string $value): bool => trim($value) !== ''));

        if ($candidates === []) {
            return null;
        }

        foreach ($candidates as $candidate) {
            $canonical = self::canonical((string) $candidate);

            if ($canonical !== null) {
                return $canonical;
            }
        }

        return null;
    }
}