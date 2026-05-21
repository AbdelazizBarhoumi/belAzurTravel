<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

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
            return Deal::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
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
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Deal $existing = null): array
    {
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
            'highlights' => ['sometimes', 'nullable', 'array'],
            'terms' => ['sometimes', 'nullable', 'array'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $title = $localized('title');
        $slug = $existing->slug ?? Str::slug($title['en'] ?? 'deal') . '-' . Str::lower(Str::random(4));

        $details = $existing?->details ?? [];
        if (array_key_exists('highlights', $data)) {
            $details['highlights'] = $data['highlights'];
        }
        if (array_key_exists('terms', $data)) {
            $details['terms'] = $data['terms'];
        }

        $category = $localized('category');

        return [
            'slug' => $slug,
            'title' => $title,
            'description' => $localized('description', ''),
            'discount' => $localized('discount'),
            'expires' => $localized('expires'),
            'category' => $category,
            'category_key' => $category['en'] ?? null,
            'details' => $details,
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
            ...$this->flatLocalized('category', $item->category),
            'category_key' => $item->category_key,
            'highlights' => $item->details['highlights'] ?? [],
            'terms' => $item->details['terms'] ?? [],
        ];
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        // Prefer explicit per-locale keys (e.g. title_en). Fall back to single-key value if present.
        $en = $data[$key . '_en'] ?? null;
        $fr = $data[$key . '_fr'] ?? null;
        $ar = $data[$key . '_ar'] ?? null;

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
}

