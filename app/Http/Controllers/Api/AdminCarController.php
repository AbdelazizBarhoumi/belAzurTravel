<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * AdminCarController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload or string path.
 * - Gallery: send `gallery` as an array of existing paths and/or
 *   `gallery_files` as uploaded image files. Uploaded files stored under
 *   `storage/app/public/uploads` and persisted with `/storage/` prefix.
 */
class AdminCarController extends Controller
{
    use \App\Concerns\HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.cars', now()->addMinutes(5), function () {
            return Car::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });
        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Car::create($this->attributes($request));
        $this->flushAdminCache('cars', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Car::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Car::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('cars', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Car::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('cars', $identifier);
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['gallery', 'features', 'policy']);

        $rules = [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'seats' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'fuel' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fuel_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fuel_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fuel_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transmission_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            'gallery' => ['sometimes', 'nullable'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['file', 'image', 'max:4096'],
            'features' => ['sometimes', 'nullable', 'array'],
            'features.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'features.*.name' => ['sometimes', 'array'],
            'features.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'features.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'features.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy' => ['sometimes', 'nullable', 'array'],
            'policy.*.id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy.*.name' => ['sometimes', 'array'],
            'policy.*.name.en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy.*.name.fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'policy.*.name.ar' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];

        $data = $request->validate($rules);

        $name = $this->localized($data, 'name', $existing?->name ?? null, 'car');
        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'car') . '-' . Str::lower(Str::random(4));

        $gallery = $this->handleGallery($request, data_get($existing, 'details.gallery', []));

        return [
            'slug' => $slug,
            'name' => $name,
            'category' => $this->localized($data, 'category', $existing?->category),
            'price' => (int) ($data['price'] ?? 0),
            'seats' => (int) ($data['seats'] ?? 0),
            'fuel' => $this->localized($data, 'fuel', $existing?->fuel),
            'transmission' => $this->localized($data, 'transmission', $existing?->transmission),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/cars'),
            'details' => $this->carDetails($data, $existing, $this->localized($data, 'description', data_get($existing, 'details.description')), $gallery),
        ];
    }

    private function adminPayload(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('category', $item->category),
            'price' => $item->price,
            'seats' => $item->seats,
            ...$this->flatLocalized('fuel', $item->fuel),
            ...$this->flatLocalized('transmission', $item->transmission),
            'image' => $item->image ? (str_starts_with($item->image, 'storage/') ? asset($item->image) : asset('storage/' . $item->image)) : null,
            ...$this->flatLocalized('description', $item->details['description'] ?? []),
            'gallery' => array_map(fn($img) => str_starts_with($img, 'storage/') ? asset($img) : asset('storage/' . $img), $item->details['gallery'] ?? [$item->image]),
            'features' => $item->details['features'] ?? [],
            'policy' => $item->details['policy'] ?? [],
        ];
    }

    private function carDetails(array $data, ?Model $existing, array $description, array $gallery): array
    {
        $details = $existing?->details ?? [];

        $details['gallery'] = $gallery;

        if (array_key_exists('features', $data)) {
            $details['features'] = $data['features'] ?? [];
        }

        if (array_key_exists('policy', $data)) {
            $details['policy'] = $data['policy'] ?? [];
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description', data_get($existing, 'details.description'));
        }

        return $details;
    }

    private function localized(array $data, string $key, array|string|null $existing = null, string $fallback = ''): array
    {
        $base = $data[$key] ?? null;
        $existing = $this->normalizeLocalizedValue($existing, $fallback);

        return [
            'fr' => $data[$key.'_fr'] ?? $base ?? ($existing['fr'] ?? $fallback),
            'ar' => $data[$key.'_ar'] ?? $base ?? ($existing['ar'] ?? $fallback),
            'en' => $data[$key.'_en'] ?? $base ?? ($existing['en'] ?? $fallback),
        ];
    }

    private function flatLocalized(string $key, array|string|null $value): array
    {
        $value = $this->normalizeLocalizedValue($value);

        return [
            $key => $value['en'] ?? '',
            $key.'_fr' => $value['fr'] ?? '',
            $key.'_ar' => $value['ar'] ?? '',
            $key.'_en' => $value['en'] ?? '',
        ];
    }

    private function localizedValue(array|string|null $value): string
    {
        if (is_array($value)) {
            return (string) ($value['en'] ?? $value['fr'] ?? $value['ar'] ?? '');
        }
        return (string) ($value ?? '');
    }

    private function normalizeLocalizedValue(array|string|null $value, string $fallback = ''): array
    {
        if (is_array($value)) {
            return [
                'en' => $value['en'] ?? $fallback,
                'fr' => $value['fr'] ?? $fallback,
                'ar' => $value['ar'] ?? $fallback,
            ];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return [
                    'en' => $decoded['en'] ?? $fallback,
                    'fr' => $decoded['fr'] ?? $fallback,
                    'ar' => $decoded['ar'] ?? $fallback,
                ];
            }
        }

        $scalar = (string) ($value ?? $fallback);

        return [
            'en' => $scalar,
            'fr' => $scalar,
            'ar' => $scalar,
        ];
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }
    }
}
