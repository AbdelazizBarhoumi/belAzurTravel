<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Deal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * AdminDealController
 *
 * API media conventions for deals:
 * - Deals do not accept main image or gallery fields via admin API.
 */
class AdminDealController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.deals', now()->addMinutes(5), function () {
            return Deal::query()
                ->oldest('id')
                ->get()
                ->map(fn (Model $item) => $this->adminPayload($item))
                ->all();
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Deal::create($this->attributes($request));
        $this->flushAdminCache('deals', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Deal::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Deal::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('deals', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Deal::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('deals', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Deal $existing = null): array
    {
        $payload = $this->normalizeListPayload($request->all());

        // Strict localized contract: admin must provide title for all locales
        $rules = [
            'title_en' => ['required', 'string', 'max:255'],
            'title_fr' => ['required', 'string', 'max:255'],
            'title_ar' => ['required', 'string', 'max:255'],

            // descriptions are optional per-locale
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],

            // discount/expiry/category localized (optional)
            'discount_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'discount_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'discount_ar' => ['sometimes', 'nullable', 'string', 'max:255'],

            'expires_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'expires_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'expires_ar' => ['sometimes', 'nullable', 'string', 'max:255'],

            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],

            // Backwards-compatible single-key fields (allowed but not required)
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'discount' => ['sometimes', 'nullable', 'string', 'max:255'],
            'expires' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'highlights_en' => ['sometimes', 'nullable', 'array'],
            'highlights_fr' => ['sometimes', 'nullable', 'array'],
            'highlights_ar' => ['sometimes', 'nullable', 'array'],
            'terms_en' => ['sometimes', 'nullable', 'array'],
            'terms_fr' => ['sometimes', 'nullable', 'array'],
            'terms_ar' => ['sometimes', 'nullable', 'array'],
        ];

        try {
            $data = validator($payload, $rules)->validate();
            Log::debug('AdminDeal validated data:', $data);
        } catch (ValidationException $e) {
            Log::warning('AdminDeal validation failed:', [
                'errors' => $e->errors(),
                'payload' => $payload,
            ]);
            throw $e;
        }

        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $title = $localized('title');
        $slug = $existing->slug ?? Str::slug($title['en'] ?? 'deal').'-'.Str::lower(Str::random(4));

        $details = $existing?->details ?? [];
        $details['highlights'] = $this->localizedList($data, 'highlights');
        $details['terms'] = $this->localizedList($data, 'terms');

        $categoryKey = (string) ($data['category_key'] ?? $data['category'] ?? $request->input('category') ?? ($existing?->category_key ?? ''));
        $category = Category::where('entity_type', 'deals')
            ->where('key', $categoryKey)
            ->first();

        $categoryName = $category?->name ?? $localized('category', $categoryKey);

        return [
            'slug' => $slug,
            'title' => $title,
            'description' => $localized('description', ''),
            'discount' => $localized('discount'),
            'expires' => $localized('expires'),
            'category' => $categoryName,
            'category_key' => $categoryKey !== '' ? $categoryKey : null,
            'details' => $details,
            'highlights' => $details['highlights'],
            'terms' => $details['terms'],
        ];
    }

    private function adminPayload(Deal $item): array
    {
        return [
            'id' => (string) $item->id,
            ...$this->flatLocalized('title', $item->title),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('discount', $item->discount),
            ...$this->flatLocalized('expires', $item->expires),
            ...$this->flatLocalized('category', $this->getCategoryName($item)),
            'category_key' => $item->category_key,
            'highlights_en' => $item->details['highlights']['en'] ?? [],
            'highlights_fr' => $item->details['highlights']['fr'] ?? [],
            'highlights_ar' => $item->details['highlights']['ar'] ?? [],
            'terms_en' => $item->details['terms']['en'] ?? [],
            'terms_fr' => $item->details['terms']['fr'] ?? [],
            'terms_ar' => $item->details['terms']['ar'] ?? [],
        ];
    }

    private function localizedList(array $data, string $key): array
    {
        return [
            'en' => array_values(array_filter($data[$key.'_en'] ?? [], fn ($item) => is_string($item) && trim($item) !== '')),
            'fr' => array_values(array_filter($data[$key.'_fr'] ?? [], fn ($item) => is_string($item) && trim($item) !== '')),
            'ar' => array_values(array_filter($data[$key.'_ar'] ?? [], fn ($item) => is_string($item) && trim($item) !== '')),
        ];
    }

    private function normalizeListPayload(array $payload): array
    {
        foreach (['highlights', 'terms'] as $baseKey) {
            foreach (['en', 'fr', 'ar'] as $lang) {
                $key = $baseKey.'_'.$lang;
                if (! array_key_exists($key, $payload)) {
                    continue;
                }

                $payload[$key] = $this->normalizeListValue($payload[$key]);
            }
        }

        return $payload;
    }

    private function normalizeListValue(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter($value, fn ($item) => is_string($item) && trim($item) !== ''));
        }

        if (is_string($value)) {
            $items = preg_split('/\R+/', trim($value)) ?: [];

            if (count($items) <= 1) {
                return trim($value) === '' ? [] : [trim($value)];
            }

            return array_values(array_filter($items, fn ($item) => trim($item) !== ''));
        }

        return [];
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        // Prefer explicit per-locale keys (e.g. title_en). Fall back to single-key value if present.
        $en = $data[$key.'_en'] ?? null;
        $fr = $data[$key.'_fr'] ?? null;
        $ar = $data[$key.'_ar'] ?? null;

        $single = $data[$key] ?? $fallback;

        return [
            'fr' => $fr ?? $single ?? '',
            'ar' => $ar ?? $single ?? '',
            'en' => $en ?? $single ?? '',
        ];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        // old admin cache keys
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }

        // public-facing cache keys used by DealController
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("{$type}.{$identifier}");
        }
    }

    private function getCategoryName(Deal $item): array|string|null
    {
        if ($item->category_key) {
            $category = Category::where('entity_type', 'deals')
                ->where('key', $item->category_key)
                ->first();

            if ($category) {
                return $category->name;
            }
        }

        return $item->category;
    }
}
