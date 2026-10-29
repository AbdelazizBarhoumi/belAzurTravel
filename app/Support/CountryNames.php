<?php

namespace App\Support;

/**
 * Canonical 3-language country names, read from the same
 * `resources/js/data/countries.json` list as the frontend. Used to normalize
 * country fields that the provider writes with a single name repeated across every language slot
 * (e.g. `{en: 'Tunisie', fr: 'Tunisie', ar: 'Tunisie'}`) back to the canonical
 * localized form (`{en: 'Tunisia', fr: 'Tunisie', ar: 'تونس'}`).
 */
class CountryNames
{
    /** @var array<string, array{en: string, fr: string, ar: string}>|null keyed by ISO-2 code */
    private static ?array $countries = null;

    /**
     * Every ISO-3166 country, read from the list shared with the frontend.
     *
     * @return array<string, array{en: string, fr: string, ar: string}>
     */
    public static function all(): array
    {
        if (self::$countries !== null) {
            return self::$countries;
        }

        $rows = json_decode((string) file_get_contents(resource_path('js/data/countries.json')), true) ?: [];

        $countries = [];
        foreach ($rows as $row) {
            $countries[$row['code']] = ['en' => $row['en'], 'fr' => $row['fr'], 'ar' => $row['ar']];
        }

        return self::$countries = $countries;
    }

    /** @var array<string, string> normalized name variant -> ISO-2 code */
    private static ?array $aliasIndex = null;

    private static function index(): array
    {
        if (self::$aliasIndex !== null) {
            return self::$aliasIndex;
        }

        $index = [];
        foreach (self::all() as $code => $names) {
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
            'Czech Republic' => 'CZ',
            'République tchèque' => 'CZ',
            'Turquie' => 'TR',
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

        return $code !== null ? self::all()[$code] : null;
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
