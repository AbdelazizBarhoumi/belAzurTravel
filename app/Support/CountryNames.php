<?php

namespace App\Support;

/**
 * Canonical 3-language country names, kept in sync with the hardcoded
 * `resources/js/data/locations.ts` list. Used to normalize country fields that
 * the provider writes with a single name repeated across every language slot
 * (e.g. `{en: 'Tunisie', fr: 'Tunisie', ar: 'Tunisie'}`) back to the canonical
 * localized form (`{en: 'Tunisia', fr: 'Tunisie', ar: 'تونس'}`).
 */
class CountryNames
{
    /** @var array<string, array{en: string, fr: string, ar: string}> keyed by ISO-2 code */
    private const COUNTRIES = [
        'TN' => ['en' => 'Tunisia', 'fr' => 'Tunisie', 'ar' => 'تونس'],
        'TR' => ['en' => 'Turkey', 'fr' => 'Turquie', 'ar' => 'تركيا'],
        'DZ' => ['en' => 'Algeria', 'fr' => 'Algérie', 'ar' => 'الجزائر'],
        'FR' => ['en' => 'France', 'fr' => 'France', 'ar' => 'فرنسا'],
        'IT' => ['en' => 'Italy', 'fr' => 'Italie', 'ar' => 'إيطاليا'],
        'ES' => ['en' => 'Spain', 'fr' => 'Espagne', 'ar' => 'إسبانيا'],
        'MA' => ['en' => 'Morocco', 'fr' => 'Maroc', 'ar' => 'المغرب'],
        'AE' => ['en' => 'United Arab Emirates', 'fr' => 'Émirats Arabes Unis', 'ar' => 'الإمارات العربية المتحدة'],
        'EG' => ['en' => 'Egypt', 'fr' => 'Égypte', 'ar' => 'مصر'],
        'ID' => ['en' => 'Indonesia', 'fr' => 'Indonésie', 'ar' => 'إندونيسيا'],
        'TH' => ['en' => 'Thailand', 'fr' => 'Thaïlande', 'ar' => 'تايلاند'],
        'DE' => ['en' => 'Germany', 'fr' => 'Allemagne', 'ar' => 'ألمانيا'],
        'GB' => ['en' => 'United Kingdom', 'fr' => 'Royaume-Uni', 'ar' => 'المملكة المتحدة'],
        'US' => ['en' => 'United States', 'fr' => 'États-Unis', 'ar' => 'الولايات المتحدة'],
        'CA' => ['en' => 'Canada', 'fr' => 'Canada', 'ar' => 'كندا'],
        'JP' => ['en' => 'Japan', 'fr' => 'Japon', 'ar' => 'اليابان'],
        'CN' => ['en' => 'China', 'fr' => 'Chine', 'ar' => 'الصين'],
        'SA' => ['en' => 'Saudi Arabia', 'fr' => 'Arabie Saoudite', 'ar' => 'المملكة العربية السعودية'],
        'MY' => ['en' => 'Malaysia', 'fr' => 'Malaisie', 'ar' => 'ماليزيا'],
        'AU' => ['en' => 'Australia', 'fr' => 'Australie', 'ar' => 'أستراليا'],
        'ZA' => ['en' => 'South Africa', 'fr' => 'Afrique du Sud', 'ar' => 'جنوب أفريقيا'],
        'IN' => ['en' => 'India', 'fr' => 'Inde', 'ar' => 'الهند'],
        'KR' => ['en' => 'South Korea', 'fr' => 'Corée du Sud', 'ar' => 'كوريا الجنوبية'],
        'BR' => ['en' => 'Brazil', 'fr' => 'Brésil', 'ar' => 'البرازيل'],
        'TZ' => ['en' => 'Tanzania', 'fr' => 'Tanzanie', 'ar' => 'تنزانيا'],
        'MU' => ['en' => 'Mauritius', 'fr' => 'Île Maurice', 'ar' => 'موريشيوس'],
        'RE' => ['en' => 'Réunion', 'fr' => 'La Réunion', 'ar' => 'ريونيون'],
        'GR' => ['en' => 'Greece', 'fr' => 'Grèce', 'ar' => 'اليونان'],
        'CZ' => ['en' => 'Czech Republic', 'fr' => 'République tchèque', 'ar' => 'التشيك'],
        'NL' => ['en' => 'Netherlands', 'fr' => 'Pays-Bas', 'ar' => 'هولندا'],
        'PT' => ['en' => 'Portugal', 'fr' => 'Portugal', 'ar' => 'البرتغال'],
        'AT' => ['en' => 'Austria', 'fr' => 'Autriche', 'ar' => 'النمسا'],
        'MV' => ['en' => 'Maldives', 'fr' => 'Maldives', 'ar' => 'المالديف'],
        'SG' => ['en' => 'Singapore', 'fr' => 'Singapour', 'ar' => 'سنغافورة'],
        'MX' => ['en' => 'Mexico', 'fr' => 'Mexique', 'ar' => 'المكسيك'],
    ];

    /** @var array<string, string> normalized name variant -> ISO-2 code */
    private static ?array $aliasIndex = null;

    private static function index(): array
    {
        if (self::$aliasIndex !== null) {
            return self::$aliasIndex;
        }

        $index = [];
        foreach (self::COUNTRIES as $code => $names) {
            foreach ($names as $name) {
                if ($name !== '') {
                    $index[self::key($name)] = $code;
                }
            }
        }

        foreach (self::aliases() as $name => $code) {
            $index[self::key($name)] = $code;
        }

        return self::$aliasIndex = $index;
    }

    /** @return array<string, string> */
    private static function aliases(): array
    {
        return [
            'États Unis' => 'US',
            'Royaume Uni' => 'GB',
            'Emirats Arabes Unis' => 'AE',
            'République Tchèque' => 'CZ',
            'Arabie Saoudite' => 'SA',
        ];
    }

    public static function key(string $name): string
    {
        $name = (string) preg_replace('/[^\p{L}\p{N}]+/u', ' ', $name);

        return mb_strtolower(trim($name));
    }

    /**
     * Resolve any known country name variant to the canonical 3-language form,
     * or null when the value cannot be matched.
     *
     * @return array{en: string, fr: string, ar: string}|null
     */
    public static function canonical(string $name): ?array
    {
        $code = self::index()[self::key($name)] ?? null;

        return $code !== null ? self::COUNTRIES[$code] : null;
    }

    /**
     * Normalize a stored `country` field. Given a provider-written object that
     * repeats a single name across all three slots, every slot is rewritten to
     * the canonical localized form. Returns null when nothing matches.
     *
     * @param  array{en?: string, fr?: string, ar?: string}|mixed  $country
     * @return array{en: string, fr: string, ar: string}|null
     */
    public static function normalize(?array $country): ?array
    {
        if (! is_array($country)) {
            return null;
        }

        $candidates = array_values(array_filter([
            $country['en'] ?? '',
            $country['fr'] ?? '',
            $country['ar'] ?? '',
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