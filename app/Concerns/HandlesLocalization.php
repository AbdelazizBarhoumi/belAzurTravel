<?php

namespace App\Concerns;

trait HandlesLocalization
{
    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;

        return [
            'fr' => $data[$key.'_fr'] ?? $base ?? '',
            'ar' => $data[$key.'_ar'] ?? $base ?? '',
            'en' => $data[$key.'_en'] ?? $base ?? '',
        ];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [
            $key => $value['en'] ?? '',
            $key.'_fr' => $value['fr'] ?? '',
            $key.'_ar' => $value['ar'] ?? '',
            $key.'_en' => $value['en'] ?? '',
        ];
    }
}
