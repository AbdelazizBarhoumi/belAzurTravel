<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DealController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'deals.index',
            now()->addMinutes(10),
            function () {
                return Deal::query()->oldest('id')
                    ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
                    ->get()->map(
                        fn (Deal $item) => $this->payload($item)
                    );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Deal::query()->where('slug', $slug)
            ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
            ->firstOrFail();

        return response()->json(Cache::remember(
            "deals.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Deal $item): array
    {
        $details = $item->details ?? [];

        return [
            'slug' => $item->slug,
            'title' => $item->title,
            'description' => $item->description,
            'category_key' => $item->category_key ?? ($item->category['en'] ?? null),
            'discount' => $item->discount,
            'expires' => $item->expires,
            'category' => $item->category,
            'highlights' => $this->flattenLocalizedList($details['highlights'] ?? []),
            'terms' => $this->flattenLocalizedList($details['terms'] ?? []),
            'category_assignments' => collect($item->categoryAssignments ?? [])->mapWithKeys(
                fn ($a) => [$a->categoryType->key => $a->categoryValue->key]
            )->toArray(),
        ];
    }

    /**
     * @param  array<int|string, mixed>  $items
     * @return array<int, array{en: string, fr: string, ar: string}>
     */
    private function flattenLocalizedList(array $items): array
    {
        if ($this->looksLikeLocaleBuckets($items)) {
            return $this->zipLocaleBuckets($items);
        }

        return array_values(array_filter(array_map(
            fn (mixed $item) => $this->normalizeLocalizedItem($item),
            $items
        ), static fn (array $item) => $item['en'] !== '' || $item['fr'] !== '' || $item['ar'] !== ''));
    }

    /**
     * @param  array<int|string, mixed>  $items
     */
    private function looksLikeLocaleBuckets(array $items): bool
    {
        return array_key_exists('en', $items)
            && array_key_exists('fr', $items)
            && array_key_exists('ar', $items)
            && (is_array($items['en']) || is_array($items['fr']) || is_array($items['ar']));
    }

    /**
     * @param  array<string, mixed>  $items
     * @return array<int, array{en: string, fr: string, ar: string}>
     */
    private function zipLocaleBuckets(array $items): array
    {
        $en = $this->normalizeStringList($items['en'] ?? []);
        $fr = $this->normalizeStringList($items['fr'] ?? []);
        $ar = $this->normalizeStringList($items['ar'] ?? []);

        $max = max(count($en), count($fr), count($ar));
        $normalized = [];

        for ($i = 0; $i < $max; $i++) {
            $entry = [
                'en' => $en[$i] ?? $fr[$i] ?? $ar[$i] ?? '',
                'fr' => $fr[$i] ?? $en[$i] ?? $ar[$i] ?? '',
                'ar' => $ar[$i] ?? $en[$i] ?? $fr[$i] ?? '',
            ];

            if ($entry['en'] !== '' || $entry['fr'] !== '' || $entry['ar'] !== '') {
                $normalized[] = $entry;
            }
        }

        return $normalized;
    }

    /**
     * @return array{en: string, fr: string, ar: string}
     */
    private function normalizeLocalizedItem(mixed $item): array
    {
        if (! is_array($item)) {
            $text = trim((string) $item);

            return ['en' => $text, 'fr' => $text, 'ar' => $text];
        }

        $localized = $item['name'] ?? $item;

        if (! is_array($localized)) {
            $text = trim((string) $localized);

            return ['en' => $text, 'fr' => $text, 'ar' => $text];
        }

        return [
            'en' => trim((string) ($localized['en'] ?? '')),
            'fr' => trim((string) ($localized['fr'] ?? '')),
            'ar' => trim((string) ($localized['ar'] ?? '')),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function normalizeStringList(mixed $values): array
    {
        if (! is_array($values)) {
            $values = [$values];
        }

        return array_values(array_filter(array_map(
            fn (mixed $value) => is_string($value) || is_numeric($value)
                ? trim((string) $value)
                : trim((string) ($value['name']['en'] ?? $value['name'] ?? $value['en'] ?? $value)),
            $values
        ), static fn (string $value) => $value !== ''));
    }
}
