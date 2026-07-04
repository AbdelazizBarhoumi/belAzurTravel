<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Promo;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PromoController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'promos.index',
            now()->addMinutes(10),
            function () {
                // Only expose promos that are active (default true when missing)
                return Promo::query()->oldest('id')->get()
                    ->filter(fn (Promo $item) => ($item->details['active'] ?? true) !== false)
                    ->map(fn (Promo $item) => $this->payload($item))
                    ->values();
            }
        );

        return response()->json($result);
    }

    public function show(string $code): JsonResponse
    {
        $item = Promo::query()->where('code', $code)->firstOrFail();

        // If the promo has been explicitly deactivated, hide it from public API
        if (isset($item->details['active']) && $item->details['active'] === false) {
            abort(404);
        }

        return response()->json(Cache::remember(
            "promos.{$code}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Promo $item): array
    {
        $details = $item->details ?? [];

        return [
            'code' => $item->code,
            'title' => $item->title,
            'discount' => $item->discount,
            'description' => $item->description,
            'expires' => $item->expires,
            'color' => $item->color,
            'eligibility' => $this->flattenLocalizedList($details['eligibility'] ?? []),
            'howToUse' => $this->flattenLocalizedList($details['howToUse'] ?? []),
            'terms' => $this->flattenLocalizedList($details['terms'] ?? []),
            'gallery' => array_map(fn ($img) => $this->normalizeApiOutputPath($img), $details['gallery'] ?? []),
            'usage_limit' => $details['usage_limit'] ?? null,
            'per_user_limit' => $details['per_user_limit'] ?? null,
            'applicable_to' => $details['applicable_to'] ?? null,
            'active' => $details['active'] ?? true,
            'is_special' => $details['is_special'] ?? false,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, string>>
     */
    private function flattenLocalizedList(array $items): array
    {
        return array_map(static function (array $item): array {
            $localized = $item['name'] ?? $item;

            return [
                'en' => $localized['en'] ?? '',
                'fr' => $localized['fr'] ?? '',
                'ar' => $localized['ar'] ?? '',
            ];
        }, $items);
    }
}
