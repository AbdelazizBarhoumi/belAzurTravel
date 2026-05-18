<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * AdminPromoController
 *
 * API media conventions for promos:
 * - Promos accept a `gallery` field as a newline-separated string of image URLs.
 * - `gallery_files` uploads are NOT accepted for promos (no file storage).
 */
class AdminPromoController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.promos', now()->addMinutes(5), function () {
            return Promo::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Promo::create($this->attributes($request));
        $this->flushAdminCache('promos', $item->code ?? null);
        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Promo::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Promo::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('promos', $item->code ?? null);
        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Promo::query()->findOrFail($id);
        $identifier = $item->code ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('promos', $identifier);
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $rules = [
            'code' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('promos', 'code')->ignore($existing?->getKey())],
            'color' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_en' => ['required_without:title', 'nullable', 'string', 'max:255'],
            'title_fr' => ['required_without:title', 'nullable', 'string', 'max:255'],
            'title_ar' => ['required_without:title', 'nullable', 'string', 'max:255'],
            'discount' => ['sometimes', 'nullable', 'string', 'max:255'],
            'discount_en' => ['required_without:discount', 'nullable', 'string', 'max:255'],
            'discount_fr' => ['required_without:discount', 'nullable', 'string', 'max:255'],
            'discount_ar' => ['required_without:discount', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['required_without:description', 'nullable', 'string'],
            'description_fr' => ['required_without:description', 'nullable', 'string'],
            'description_ar' => ['required_without:description', 'nullable', 'string'],
            'expires' => ['sometimes', 'nullable', 'string', 'max:255'],
            'expires_en' => ['required_without:expires', 'nullable', 'string', 'max:255'],
            'expires_fr' => ['required_without:expires', 'nullable', 'string', 'max:255'],
            'expires_ar' => ['required_without:expires', 'nullable', 'string', 'max:255'],
            'eligibility' => ['sometimes', 'nullable', 'string'],
            'eligibility_en' => ['required_without:eligibility', 'nullable', 'string'],
            'eligibility_fr' => ['required_without:eligibility', 'nullable', 'string'],
            'eligibility_ar' => ['required_without:eligibility', 'nullable', 'string'],
            'howToUse' => ['sometimes', 'nullable', 'string'],
            'howToUse_en' => ['required_without:howToUse', 'nullable', 'string'],
            'howToUse_fr' => ['required_without:howToUse', 'nullable', 'string'],
            'howToUse_ar' => ['required_without:howToUse', 'nullable', 'string'],
            'terms' => ['sometimes', 'nullable', 'string'],
            'terms_en' => ['required_without:terms', 'nullable', 'string'],
            'terms_fr' => ['required_without:terms', 'nullable', 'string'],
            'terms_ar' => ['required_without:terms', 'nullable', 'string'],
            'usage_limit' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'per_user_limit' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'applicable_to' => ['sometimes', 'nullable', 'string', 'max:255'],
            'active' => ['sometimes', 'nullable', 'boolean'],
            // Accept newline-separated gallery URLs (no file uploads for promos)
            'gallery' => ['sometimes', 'nullable', 'string'],
        ];

        $data = $request->validate($rules);
        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $title = $localized('title');
        $code = $existing->code ?? ($data['code'] ?? Str::upper(Str::random(8)));


        return [
            'code' => $code,
            'title' => $localized('title', ''),
            'discount' => $localized('discount'),
            'description' => $localized('description', ''),
            'expires' => $localized('expires'),
            'color' => $data['color'] ?? $existing->color ?? 'from-primary to-primary/70',
            'details' => array_merge($existing->details ?? [], [
                'eligibility' => $this->buildLocalizedList($data, 'eligibility', $existing),
                'howToUse' => $this->buildLocalizedList($data, 'howToUse', $existing),
                'terms' => $this->buildLocalizedList($data, 'terms', $existing),
                'gallery' => isset($data['gallery']) ? $this->splitLines((string) $data['gallery']) : ($existing->details['gallery'] ?? []),
                'usage_limit' => isset($data['usage_limit']) ? (int) $data['usage_limit'] : ($existing->details['usage_limit'] ?? null),
                'per_user_limit' => isset($data['per_user_limit']) ? (int) $data['per_user_limit'] : ($existing->details['per_user_limit'] ?? null),
                'applicable_to' => $data['applicable_to'] ?? $existing->details['applicable_to'] ?? null,
                'active' => isset($data['active']) ? (bool) $data['active'] : ($existing->details['active'] ?? true),
            ]),
        ];
    }

    private function adminPayload(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            'code' => $item->code,
            ...$this->flatLocalized('title', $item->title),
            ...$this->flatLocalized('discount', $item->discount),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('expires', $item->expires),
            'color' => $item->color,
            'eligibility_en' => implode("\n", array_map(fn($it) => $it['en'] ?? '', $item->details['eligibility'] ?? [])),
            'eligibility_fr' => implode("\n", array_map(fn($it) => $it['fr'] ?? '', $item->details['eligibility'] ?? [])),
            'eligibility_ar' => implode("\n", array_map(fn($it) => $it['ar'] ?? '', $item->details['eligibility'] ?? [])),
            'howToUse_en' => implode("\n", array_map(fn($it) => $it['en'] ?? '', $item->details['howToUse'] ?? [])),
            'howToUse_fr' => implode("\n", array_map(fn($it) => $it['fr'] ?? '', $item->details['howToUse'] ?? [])),
            'howToUse_ar' => implode("\n", array_map(fn($it) => $it['ar'] ?? '', $item->details['howToUse'] ?? [])),
            'terms_en' => implode("\n", array_map(fn($it) => $it['en'] ?? '', $item->details['terms'] ?? [])),
            'terms_fr' => implode("\n", array_map(fn($it) => $it['fr'] ?? '', $item->details['terms'] ?? [])),
            'terms_ar' => implode("\n", array_map(fn($it) => $it['ar'] ?? '', $item->details['terms'] ?? [])),
            'gallery' => implode("\n", $item->details['gallery'] ?? []),
            'usage_limit' => $item->details['usage_limit'] ?? null,
            'per_user_limit' => $item->details['per_user_limit'] ?? null,
            'applicable_to' => $item->details['applicable_to'] ?? null,
            'active' => $item->details['active'] ?? true,
        ];
    }

    private function buildLocalizedList(array $data, string $key, ?Model $existing): array
    {
        $en = $data[$key . '_en'] ?? null;
        $fr = $data[$key . '_fr'] ?? null;
        $ar = $data[$key . '_ar'] ?? null;
        if ($en !== null || $fr !== null || $ar !== null) {
            $enLines = $this->splitLines((string) ($en ?? ''));
            $frLines = $this->splitLines((string) ($fr ?? ''));
            $arLines = $this->splitLines((string) ($ar ?? ''));
            $max = max(count($enLines), count($frLines), count($arLines));
            $items = [];
            for ($i = 0; $i < $max; $i++) {
                $items[] = ['en' => $enLines[$i] ?? $frLines[$i] ?? $arLines[$i] ?? '', 'fr' => $frLines[$i] ?? $enLines[$i] ?? $arLines[$i] ?? '', 'ar' => $arLines[$i] ?? $enLines[$i] ?? $frLines[$i] ?? ''];
            }
            return array_values(array_filter($items, static fn ($it) => ($it['en'] !== '' || $it['fr'] !== '' || $it['ar'] !== '')));
        }

        if (array_key_exists($key, $data)) {
            $lines = $this->splitLines((string) ($data[$key] ?? ''));
            return array_map(fn (string $line) => ['en' => $line, 'fr' => $line, 'ar' => $line], $lines);
        }

        return $existing?->details[$key] ?? [];
    }

    private function splitLines(string $value): array
    {
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;
        return ['fr' => $data[$key.'_fr'] ?? $base ?? '', 'ar' => $data[$key.'_ar'] ?? $base ?? '', 'en' => $data[$key.'_en'] ?? $base ?? ''];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("{$type}.{$identifier}");
        }
    }
}

