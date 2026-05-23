<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Promo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * AdminPromoController
 *
 * API media conventions for promos:
 * - Promos accept a `gallery` field as an array of image URLs.
 */
class AdminPromoController extends Controller
{
    use HandlesAdminMedia;

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

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['eligibility', 'howToUse', 'terms', 'gallery']);

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
            'eligibility' => ['sometimes', 'nullable'],
            'eligibility.*.name' => ['sometimes', 'array'],
            'eligibility_en' => ['sometimes', 'nullable', 'string'],
            'eligibility_fr' => ['sometimes', 'nullable', 'string'],
            'eligibility_ar' => ['sometimes', 'nullable', 'string'],
            'howToUse' => ['sometimes', 'nullable'],
            'howToUse.*.name' => ['sometimes', 'array'],
            'howToUse_en' => ['sometimes', 'nullable', 'string'],
            'howToUse_fr' => ['sometimes', 'nullable', 'string'],
            'howToUse_ar' => ['sometimes', 'nullable', 'string'],
            'terms' => ['sometimes', 'nullable'],
            'terms.*.name' => ['sometimes', 'array'],
            'terms_en' => ['sometimes', 'nullable', 'string'],
            'terms_fr' => ['sometimes', 'nullable', 'string'],
            'terms_ar' => ['sometimes', 'nullable', 'string'],
            'usage_limit' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'per_user_limit' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'applicable_to' => ['sometimes', 'nullable', 'string', 'max:255'],
            'active' => ['sometimes', 'nullable', 'boolean'],
            'gallery' => ['sometimes', 'nullable'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['file', 'image', 'max:4096'],
        ];

        try {
            $data = $request->validate($rules);
        } catch (ValidationException $e) {
            Log::error('Promo validation failed', [
                'errors' => $e->errors(),
                'input' => $request->except(['password', 'password_confirmation']),
            ]);

            throw $e;
        }
        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $code = $existing->code ?? ($data['code'] ?? Str::upper(Str::random(8)));

        $gallery = $this->handleGallery($request, $existing?->details['gallery'] ?? [], 'uploads/promos');

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
                'gallery' => $gallery,
                'usage_limit' => isset($data['usage_limit']) ? (int) $data['usage_limit'] : ($existing->details['usage_limit'] ?? null),
                'per_user_limit' => isset($data['per_user_limit']) ? (int) $data['per_user_limit'] : ($existing->details['per_user_limit'] ?? null),
                'applicable_to' => $data['applicable_to'] ?? $existing->details['applicable_to'] ?? null,
                'active' => isset($data['active']) ? (bool) $data['active'] : ($existing->details['active'] ?? true),
            ]),
        ];
    }

    private function adminPayload(Model $item): array
    {
        $payload = [
            'id' => (string) $item->id,
            'code' => $item->code,
            ...$this->flatLocalized('title', $item->title),
            ...$this->flatLocalized('discount', $item->discount),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('expires', $item->expires),
            'color' => $item->color,
            'eligibility' => $this->adminLocalizedList($item->details['eligibility'] ?? []),
            'howToUse' => $this->adminLocalizedList($item->details['howToUse'] ?? []),
            'terms' => $this->adminLocalizedList($item->details['terms'] ?? []),
            'gallery' => implode("\n", $item->details['gallery'] ?? []),
        ];

        $payload['usage_limit'] = $item->details['usage_limit'] ?? null;
        $payload['per_user_limit'] = $item->details['per_user_limit'] ?? null;
        $payload['applicable_to'] = $item->details['applicable_to'] ?? null;
        $payload['active'] = $item->details['active'] ?? true;

        return $payload;
    }

    private function buildLocalizedList(array $data, string $key, ?Model $existing): array
    {
        if (isset($data[$key]) && is_array($data[$key])) {
            return array_map(static function (array $item): array {
                $localized = $item['name'] ?? $item;

                return [
                    'name' => [
                        'en' => $localized['en'] ?? '',
                        'fr' => $localized['fr'] ?? '',
                        'ar' => $localized['ar'] ?? '',
                    ],
                ];
            }, $data[$key]);
        }

        $en = $data[$key.'_en'] ?? null;
        $fr = $data[$key.'_fr'] ?? null;
        $ar = $data[$key.'_ar'] ?? null;
        if ($en !== null || $fr !== null || $ar !== null) {
            $enLines = $this->splitLines((string) ($en ?? ''));
            $frLines = $this->splitLines((string) ($fr ?? ''));
            $arLines = $this->splitLines((string) ($ar ?? ''));
            $max = max(count($enLines), count($frLines), count($arLines));
            $items = [];
            for ($i = 0; $i < $max; $i++) {
                $items[] = ['name' => ['en' => $enLines[$i] ?? $frLines[$i] ?? $arLines[$i] ?? '', 'fr' => $frLines[$i] ?? $enLines[$i] ?? $arLines[$i] ?? '', 'ar' => $arLines[$i] ?? $enLines[$i] ?? $frLines[$i] ?? '']];
            }

            return array_values(array_filter($items, static fn ($it) => ($it['name']['en'] !== '' || $it['name']['fr'] !== '' || $it['name']['ar'] !== '')));
        }

        if (array_key_exists($key, $data)) {
            $lines = $this->splitLines((string) ($data[$key] ?? ''));

            return array_map(fn (string $line) => ['name' => ['en' => $line, 'fr' => $line, 'ar' => $line]], $lines);
        }

        return $existing?->details[$key] ?? [];
    }

    private function adminLocalizedList(array $items): array
    {
        return array_map(static function (array $item): array {
            $localized = $item['name'] ?? $item;

            return [
                'name' => [
                    'en' => $localized['en'] ?? '',
                    'fr' => $localized['fr'] ?? '',
                    'ar' => $localized['ar'] ?? '',
                ],
            ];
        }, $items);
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

    private function splitLines(string $value): array
    {
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }
}
