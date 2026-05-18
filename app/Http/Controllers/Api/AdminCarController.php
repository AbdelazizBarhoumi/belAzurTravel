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
 * - Main image: send `image` as a File upload or string URL.
 * - Gallery: frontend may send `gallery` (newline-separated URLs) and/or
 *   `gallery_files` as uploaded image files. Uploaded files stored under
 *   `storage/app/public/uploads` and persisted with `/storage/` prefix.
 */
class AdminCarController extends Controller
{
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
            'gallery' => ['sometimes', 'nullable', 'string'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['file', 'image', 'max:4096'],
            'features' => ['sometimes', 'nullable', 'string'],
            'policy' => ['sometimes', 'nullable', 'string'],
        ];

        $data = $request->validate($rules);

        $name = $this->localized($data, 'name', $existing?->name ?? null, 'car');
        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'car') . '-' . Str::lower(Str::random(4));

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('uploads', 'public');
            $image = '/storage/' . $path;
        } else {
            $incoming = $data['image'] ?? $existing?->image ?? '';
            if ($incoming === '') {
                $image = '';
            } elseif (str_starts_with($incoming, 'http://') || str_starts_with($incoming, 'https://')) {
                $image = $existing?->image ?? '';
            } else {
                $image = $incoming;
            }
        }

        if (array_key_exists('gallery', $data) || $request->hasFile('gallery_files')) {
            $gallery = array_key_exists('gallery', $data)
                ? $this->splitLines((string) ($data['gallery'] ?? ''))
                : (array) data_get($existing, 'details.gallery', []);

            if ($request->hasFile('gallery_files')) {
                $galleryPaths = collect($request->file('gallery_files', []))
                    ->filter()
                    ->map(fn ($file) => '/storage/' . $file->store('uploads', 'public'))
                    ->values()
                    ->all();

                $gallery = array_values(array_unique(array_merge($gallery, $galleryPaths)));
            }

            $data['gallery'] = implode("\n", $gallery);
        }

        return [
            'slug' => $slug,
            'name' => $name,
            'category' => $this->localized($data, 'category', $existing?->category),
            'price' => (int) ($data['price'] ?? 0),
            'seats' => (int) ($data['seats'] ?? 0),
            'fuel' => $this->localized($data, 'fuel', $existing?->fuel),
            'transmission' => $this->localized($data, 'transmission', $existing?->transmission),
            'image' => $image,
            'details' => $this->carDetails($data, $existing, $this->localized($data, 'description', data_get($existing, 'details.description'))),
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
            'image' => $item->image,
            ...$this->flatLocalized('description', $item->details['description'] ?? []),
            'gallery' => $item->details['gallery'] ?? [$item->image],
            'features' => array_values(array_map(fn (mixed $feature): string => $this->localizedValue($feature), $item->details['features'] ?? [])),
            'policy' => array_values(array_map(fn (mixed $rule): string => $this->localizedValue($rule), $item->details['policy'] ?? [])),
        ];
    }

    private function carDetails(array $data, ?Model $existing, array $description): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('gallery', $data)) {
            $details['gallery'] = $this->splitLines((string) ($data['gallery'] ?? ''));
        }

        if (array_key_exists('features', $data)) {
            $details['features'] = array_map(fn (string $item): array => ['fr' => $item, 'ar' => $item, 'en' => $item], $this->splitLines((string) ($data['features'] ?? '')));
        }

        if (array_key_exists('policy', $data)) {
            $details['policy'] = array_map(fn (string $item): array => ['fr' => $item, 'ar' => $item, 'en' => $item], $this->splitLines((string) ($data['policy'] ?? '')));
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description', data_get($existing, 'details.description'));
        }

        return $details;
    }

    private function localized(array $data, string $key, ?array $existing = null, string $fallback = ''): array
    {
        $base = $data[$key] ?? null;

        return [
            'fr' => $data[$key.'_fr'] ?? $base ?? ($existing['fr'] ?? $fallback),
            'ar' => $data[$key.'_ar'] ?? $base ?? ($existing['ar'] ?? $fallback),
            'en' => $data[$key.'_en'] ?? $base ?? ($existing['en'] ?? $fallback),
        ];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function splitLines(string $value): array
    {
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }

    private function localizedValue(array|string|null $value): string
    {
        if (is_array($value)) {
            return (string) ($value['en'] ?? $value['fr'] ?? $value['ar'] ?? '');
        }
        return (string) ($value ?? '');
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

