<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AdminEventController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.events', now()->addMinutes(5), function () {
            return Event::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });
        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Event::create($this->attributes($request));
        $this->flushAdminCache('events', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Event::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Event::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('events', $item->slug ?? null);
        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Event::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('events', $identifier);
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $rules = [
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'description' => ['sometimes', 'nullable', 'string'],
            'description_en' => ['sometimes', 'nullable', 'string'],
            'description_fr' => ['sometimes', 'nullable', 'string'],
            'description_ar' => ['sometimes', 'nullable', 'string'],
            // detail sections
            'about' => ['sometimes', 'nullable', 'string'],
            'about_en' => ['sometimes', 'nullable', 'string'],
            'about_fr' => ['sometimes', 'nullable', 'string'],
            'about_ar' => ['sometimes', 'nullable', 'string'],
            'attendees' => ['sometimes', 'nullable', 'string'],
            'attendees_en' => ['sometimes', 'nullable', 'string'],
            'attendees_fr' => ['sometimes', 'nullable', 'string'],
            'attendees_ar' => ['sometimes', 'nullable', 'string'],
            'gallery' => ['sometimes', 'nullable', 'string'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => $request->hasFile('gallery_files') ? ['image', 'max:10240'] : ['sometimes', 'nullable'],
            'schedule' => ['sometimes', 'nullable'],
        ];

        $data = $request->validate($rules);
        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $title = $localized('title');
        $slug = $existing->slug ?? Str::slug($title['en'] ?? 'event') . '-' . Str::lower(Str::random(4));

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('uploads/events', 'public');
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
        // Handle gallery file uploads and merge with any provided gallery paths
        if ($request->hasFile('gallery_files')) {
            $galleryPaths = collect($request->file('gallery_files', []))
                ->filter()
                ->map(fn ($file) => '/storage/' . $file->store('uploads/events', 'public'))
                ->values()
                ->all();

            $existingGallery = isset($data['gallery']) ? $this->splitLines((string) $data['gallery']) : [];
            $data['gallery'] = implode("\n", array_values(array_unique(array_merge($existingGallery, $galleryPaths))));
        }

        return [
            'slug' => $slug,
            'title' => $localized('title'),
            'location' => $localized('location'),
            'date' => $localized('date'),
            'price' => (int) ($data['price'] ?? 0),
            'image' => $image,
            'description' => $localized('description', ''),
            'details' => $this->eventDetails($data, $existing, $this->localized($data, 'description', '')),
        ];
    }

    private function adminPayload(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            ...$this->flatLocalized('title', $item->title),
            ...$this->flatLocalized('location', $item->location),
            ...$this->flatLocalized('date', $item->date),
            'price' => $item->price,
            'image' => $item->image,
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('about', $item->details['about'] ?? []),
            ...$this->flatLocalized('attendees', $item->details['attendees'] ?? []),
            'gallery' => $item->details['gallery'] ?? [$item->image],
            'schedule' => $item->details['schedule'] ?? [],
        ];
    }

    private function eventDetails(array $data, ?Model $existing, array $description): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('gallery', $data)) {
            $details['gallery'] = $this->splitLines((string) ($data['gallery'] ?? ''));
        }

        if (array_key_exists('about', $data) || array_key_exists('about_en', $data) || array_key_exists('about_fr', $data) || array_key_exists('about_ar', $data)) {
            $details['about'] = $this->localized($data, 'about');
        }

        if (array_key_exists('attendees', $data) || array_key_exists('attendees_en', $data) || array_key_exists('attendees_fr', $data) || array_key_exists('attendees_ar', $data)) {
            $details['attendees'] = $this->localized($data, 'attendees');
        }

        // Schedule may be posted as JSON string or array
        if (array_key_exists('schedule', $data) && $data['schedule'] !== null && $data['schedule'] !== '') {
            $schedule = $data['schedule'];
            if (is_string($schedule)) {
                $decoded = json_decode($schedule, true);
                $details['schedule'] = is_array($decoded) ? $decoded : [];
            } elseif (is_array($schedule)) {
                $details['schedule'] = $schedule;
            }
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description');
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
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }
    }
}

