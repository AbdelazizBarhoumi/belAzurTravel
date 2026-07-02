<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Concerns\HandlesLocalization;
use App\Http\Controllers\Controller;
use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\EntityCategoryAssignment;
use App\Models\Event;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * AdminEventController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload or string path.
 * - Gallery: send `gallery` as an array of existing paths and/or
 *   `gallery_files` as uploaded image files.
 */
class AdminEventController extends Controller
{
    use HandlesAdminMedia, HandlesLocalization;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.events', now()->addMinutes(5), function () {
            return Event::query()
                ->oldest('id')
                ->get()
                ->map(fn (Model $item) => $this->adminPayload($item))
                ->all();
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Event::create($this->attributes($request));
        $this->syncCategoryAssignments($item, 'events', $request->input('category_assignments', []));
        $this->flushAdminCache('events', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))], 201);
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
        $this->syncCategoryAssignments($item, 'events', $request->input('category_assignments', []));
        $this->flushAdminCache('events', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Event::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('events', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['gallery', 'schedule']);

        $rules = [
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_key' => ['sometimes', 'nullable', 'string', 'max:255'],
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
            'gallery' => ['sometimes', 'nullable', 'array'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['image', 'max:10240'],
            'schedule' => ['sometimes', 'nullable', 'array'],
        ];

        $data = $request->validate($rules);
        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $title = $localized('title');
        $slug = $existing->slug ?? Str::slug($title['en'] ?? 'event').'-'.Str::lower(Str::random(4));

        $gallery = $this->handleGallery($request, $existing?->details['gallery'] ?? [], 'uploads/events');

        return [
            'slug' => $slug,
            'category_key' => $data['category_key'] ?? $existing?->category_key,
            'title' => $localized('title'),
            'location' => $localized('location'),
            'date' => $localized('date'),
            'price' => (int) ($data['price'] ?? 0),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/events'),
            'description' => $localized('description', ''),
            'details' => $this->eventDetails($data, $existing, $this->localized($data, 'description', ''), $gallery),
        ];
    }

    private function adminPayload(Model $item): array
    {
        $categoryAssignments = [];
        if ($item->relationLoaded('categoryAssignments')) {
            foreach ($item->categoryAssignments as $assignment) {
                $typeKey = $assignment->categoryType?->key;
                $valueKey = $assignment->categoryValue?->key;
                if ($typeKey && $valueKey) {
                    $categoryAssignments[$typeKey] = $valueKey;
                }
            }
        }

        return [
            'id' => (string) $item->id,
            'category_key' => $item->category_key,
            ...$this->flatLocalized('title', $item->title),
            ...$this->flatLocalized('location', $item->location),
            ...$this->flatLocalized('date', $item->date),
            'category_assignments' => $categoryAssignments,
            'price' => $item->price,
            'image' => $this->normalizeApiOutputPath($item->image),
            ...$this->flatLocalized('description', $item->description),
            ...$this->flatLocalized('about', $item->details['about'] ?? []),
            ...$this->flatLocalized('attendees', $item->details['attendees'] ?? []),
            'gallery' => $item->details['gallery'] ?? [$item->image],
            'schedule' => $item->details['schedule'] ?? [],
        ];
    }

    private function eventDetails(array $data, ?Model $existing, array $description, array $gallery): array
    {
        $details = $existing?->details ?? [];

        $details['gallery'] = $gallery;

        if (array_key_exists('about', $data) || array_key_exists('about_en', $data) || array_key_exists('about_fr', $data) || array_key_exists('about_ar', $data)) {
            $details['about'] = $this->localized($data, 'about');
        }

        if (array_key_exists('attendees', $data) || array_key_exists('attendees_en', $data) || array_key_exists('attendees_fr', $data) || array_key_exists('attendees_ar', $data)) {
            $details['attendees'] = $this->localized($data, 'attendees');
        }

        if (array_key_exists('schedule', $data)) {
            $details['schedule'] = $data['schedule'] ?? [];
        }

        if (array_key_exists('description', $data) || array_key_exists('description_en', $data) || array_key_exists('description_fr', $data) || array_key_exists('description_ar', $data)) {
            $details['description'] = $this->localized($data, 'description');
        }

        return $details;
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
            Cache::forget("{$type}.{$identifier}");
        }
    }

    private function syncCategoryAssignments(Model $entity, string $entityType, array $assignments): void
    {
        EntityCategoryAssignment::where('entity_type', $entityType)
            ->where('entity_id', $entity->id)
            ->delete();

        $firstValue = null;

        foreach ($assignments as $typeKey => $valueKey) {
            $type = CategoryType::where('entity_type', $entityType)->where('key', $typeKey)->first();
            if (! $type) {
                continue;
            }
            $value = $type->values()->where('key', $valueKey)->first();
            if (! $value) {
                continue;
            }

            EntityCategoryAssignment::create([
                'entity_type' => $entityType,
                'entity_id' => $entity->id,
                'category_type_id' => $type->id,
                'category_value_id' => $value->id,
            ]);

            if (! $firstValue) {
                $firstValue = $value;
            }
        }

        if ($firstValue && Schema::hasColumn('events', 'category_key')) {
            $entity->update([
                'category_key' => $firstValue->key,
                'category' => $firstValue->name,
            ]);
        }
    }
}
