<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\GalleryImage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * AdminTourController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload (multipart) or as a string URL.
 * - Gallery: send `gallery` as a newline-separated string of URLs and/or
 *   `gallery_files` as an array of uploaded image files. Uploaded files are
 *   stored under `storage/app/public/uploads` and persisted with `/storage/` prefix.
 */
class AdminTourController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.tours', now()->addMinutes(5), function () {
            return Tour::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });
        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Tour::create($this->attributes($request));
        $this->flushAdminCache('tours', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Tour::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Tour::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('tours', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Tour::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('tours', $identifier);
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $rules = [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_days' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'duration_nights' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_group' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            'itinerary' => ['sometimes', 'nullable', 'array'],
            'includes' => ['sometimes', 'nullable', 'array'],
            'excludes' => ['sometimes', 'nullable', 'array'],
            'images' => ['sometimes', 'nullable', 'array'],
            'gallery' => ['sometimes', 'nullable', 'string'],
            'gallery_files' => ['sometimes', 'array'],
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $name = $localized('name');
        $slug = $existing->slug ?? Str::slug($name['en'] ?? 'tour') . '-' . Str::lower(Str::random(4));

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

        // ensure images array is populated from gallery if provided
        if (!isset($data['images']) && isset($data['gallery'])) {
            $data['images'] = $this->splitLines((string) $data['gallery']);
        }

        return [
            'slug' => $slug,
            'name' => $name,
            'location' => $localized('location'),
            'duration' => $localized('duration'),
            'duration_days' => (int) ($data['duration_days'] ?? $existing->duration_days ?? 0),
            'duration_nights' => (int) ($data['duration_nights'] ?? $existing->duration_nights ?? 0),
            'max_group' => (int) ($data['max_group'] ?? $existing->max_group ?? 0),
            'price' => (int) ($data['price'] ?? 0),
            'rating' => (float) ($data['rating'] ?? 0),
            'image' => $image,
            'description' => $localized('description', ''),
            'images' => $data['images'] ?? $existing->images ?? [],
            'itinerary' => $data['itinerary'] ?? $existing->itinerary ?? [],
            'includes' => $data['includes'] ?? $existing->includes ?? [],
            'excludes' => $data['excludes'] ?? $existing->excludes ?? [],
            'details' => array_merge($existing->details ?? [], [
                'itinerary' => $data['itinerary'] ?? $existing->details['itinerary'] ?? [],
                'inclusions' => $data['includes'] ?? $existing->details['inclusions'] ?? [],
                'excludes' => $data['excludes'] ?? $existing->details['excludes'] ?? [],
                'images' => $data['images'] ?? $existing->details['images'] ?? [],
            ]),
        ];
    }

    private function adminPayload(Model $item): array
    {
        $images = $item->details['images'] ?? $item->images ?? [];
        // Resolve image ids to URLs when needed
        $resolvedImages = array_map(function ($img) {
            if (is_int($img) || (is_string($img) && ctype_digit($img))) {
                $id = (int) $img;
                $g = GalleryImage::find($id);
                return $g ? $g->url : (string) $img;
            }
            return (string) $img;
        }, $images);

        return [
            'id' => (string) $item->id,
            'slug' => $item->slug,
            ...$this->flatLocalized('name', $item->name),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('location', $item->location),
            ...$this->flatLocalized('duration', $item->duration),
            'duration_days' => $item->duration_days,
            'duration_nights' => $item->duration_nights,
            'max_group' => $item->max_group,
            'price' => $item->price,
            'rating' => $item->rating,
            'image' => $item->image,
            'itinerary' => $item->details['itinerary'] ?? $item->itinerary ?? [],
            'includes' => $item->details['inclusions'] ?? $item->includes ?? [],
            'excludes' => $item->details['excludes'] ?? $item->excludes ?? [],
            'images' => $resolvedImages,
        ];
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;
        return ['fr' => $data[$key.'_fr'] ?? $base ?? '', 'ar' => $data[$key.'_ar'] ?? $base ?? '', 'en' => $data[$key.'_en'] ?? $base ?? ''];
    }

    private function splitLines(string $value): array
    {
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
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

