<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\GalleryImage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AdminDestinationController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.destinations', now()->addMinutes(5), function () {
            return Destination::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Destination::create($this->attributes($request));
        $this->flushAdminCache('destinations', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Destination::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Destination::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('destinations', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Destination::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('destinations', $identifier);

        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $rules = [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => ['sometimes', 'required', 'string', 'max:255'],
            'country_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            'about' => ['sometimes', 'nullable', 'string'],
            'about_en' => ['sometimes', 'nullable', 'string'],
            'about_fr' => ['sometimes', 'nullable', 'string'],
            'about_ar' => ['sometimes', 'nullable', 'string'],
            'gallery' => ['sometimes', 'nullable', 'string'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['file', 'image', 'max:4096'],
            'highlights' => ['sometimes', 'nullable', 'string'],
            'bestTime' => ['sometimes', 'nullable', 'string'],
            'bestTime_en' => ['sometimes', 'nullable', 'string'],
            'bestTime_fr' => ['sometimes', 'nullable', 'string'],
            'bestTime_ar' => ['sometimes', 'nullable', 'string'],
            'language' => ['sometimes', 'nullable', 'string'],
            'language_en' => ['sometimes', 'nullable', 'string'],
            'language_fr' => ['sometimes', 'nullable', 'string'],
            'language_ar' => ['sometimes', 'nullable', 'string'],
            'currency' => ['sometimes', 'nullable', 'string'],
            'currency_en' => ['sometimes', 'nullable', 'string'],
            'currency_fr' => ['sometimes', 'nullable', 'string'],
            'currency_ar' => ['sometimes', 'nullable', 'string'],
            'weather' => ['sometimes', 'nullable', 'string'],
            'weather_en' => ['sometimes', 'nullable', 'string'],
            'weather_fr' => ['sometimes', 'nullable', 'string'],
            'weather_ar' => ['sometimes', 'nullable', 'string'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);

        $name = $localized('name');
        $title = $localized('title', $name['en']);
        $label = $name['en'] ?: $title['en'] ?: 'destination';
        $slugBase = is_string($label) ? $label : 'destination';
        $slug = $existing->slug ?? Str::slug($slugBase).'-'.Str::lower(Str::random(5));
        $description = $localized('description', '');

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

        if ($request->hasFile('gallery_files')) {
            $galleryPaths = collect($request->file('gallery_files', []))
                ->filter()
                ->map(fn ($file) => '/storage/' . $file->store('uploads', 'public'))
                ->values()
                ->all();

            $existingGallery = isset($data['gallery']) ? $this->splitLines((string) $data['gallery']) : [];
            $data['gallery'] = implode("\n", array_values(array_unique(array_merge($existingGallery, $galleryPaths))));
        }

        return [
            'slug' => $slug,
            'name' => $name,
            'country' => $localized('country'),
            'category_key' => Str::slug($data['category_en'] ?? $data['category'] ?? 'other'),
            'category' => $localized('category', 'Other'),
            'price' => (int) ($data['price'] ?? 0),
            'rating' => (float) ($data['rating'] ?? 0),
            'image' => $image,
            'description' => $description,
            'details' => $this->destinationDetails($data, $existing, $description),
        ];
    }

    private function adminPayload(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('country', $item->country),
            ...$this->flatLocalized('category', $item->category),
            'price' => $item->price,
            'rating' => $item->rating,
            'image' => $item->image,
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('about', $item->details['about'] ?? null),
            'gallery' => $item->details['gallery'] ?? [$item->image],
            'highlights' => array_values(array_map(fn (mixed $highlight): string => $this->localizedValue($highlight), $item->details['highlights'] ?? [])),
            ...$this->flatLocalized('bestTime', $item->details['bestTime'] ?? null),
            ...$this->flatLocalized('language', $item->details['language'] ?? null),
            ...$this->flatLocalized('currency', $item->details['currency'] ?? null),
            ...$this->flatLocalized('weather', $item->details['weather'] ?? null),
        ];
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

    private function destinationDetails(array $data, ?Model $existing, array $description): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('about', $data) || array_key_exists('about_en', $data) || array_key_exists('about_fr', $data) || array_key_exists('about_ar', $data)) {
            $details['about'] = $this->localized($data, 'about', $description['en'] ?? '');
        }

        if (array_key_exists('gallery', $data)) {
            $details['gallery'] = $this->splitLines((string) ($data['gallery'] ?? ''));
        }

        if (array_key_exists('highlights', $data)) {
            $details['highlights'] = array_map(fn (string $item): array => ['fr' => $item, 'ar' => $item, 'en' => $item], $this->splitLines((string) ($data['highlights'] ?? '')));
        }

        foreach (['bestTime', 'language', 'currency', 'weather'] as $key) {
            if (array_key_exists($key, $data) || array_key_exists($key.'_en', $data) || array_key_exists($key.'_fr', $data) || array_key_exists($key.'_ar', $data)) {
                $details[$key] = $this->localized($data, $key);
            }
        }

        return $details;
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
        // old admin cache keys
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }

        // public-facing cache keys used by DestinationController and friends
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("{$type}.{$identifier}");
        }
    }
}

