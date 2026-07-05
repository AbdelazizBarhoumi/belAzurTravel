<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use App\Models\Travel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class TravelController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'travels.index',
            now()->addMinutes(10),
            function () {
                return Travel::query()->oldest('id')
                    ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
                    ->get()->map(
                    fn (Travel $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Travel::query()->where('slug', $slug)
            ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
            ->firstOrFail();

        return response()->json(Cache::remember(
            "travels.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    private function payload(Travel $item): array
    {
        $gallery = $this->resolveImageUrls($item->images ?? []);

        return [
            'id' => $item->slug,
            'slug' => $item->slug,
            'name' => $item->name,
            'location' => $item->location,
            'duration' => $item->duration,
            'maxGroup' => $item->max_group,
            'price' => $item->price,
            'pricePerPerson' => $item->price,
            'rating' => $item->rating,
            'image' => $this->normalizeApiOutputPath($item->image),
            'description' => $item->description,
            'type' => data_get($item, 'details.type') ?? null,
            'durationDays' => $item->duration_days,
            'durationNights' => $item->duration_nights,
            'gallery' => $gallery,
            'images' => $gallery,
            'tags' => data_get($item, 'details.tags') ?? null,
            'itinerary' => $item->itinerary,
            'inclusions' => $item->includes,
            'excludes' => $item->excludes,
            // Filter fields
            'istanbul' => $item->istanbul,
            'asie' => $item->asie,
            'europe' => $item->europe,
            'afrique_nord' => $item->afrique_nord,
            'jeune' => $item->jeune,
            'tranquille' => $item->tranquille,
            'category_assignments' => collect($item->categoryAssignments ?? [])->mapWithKeys(
                fn ($a) => [$a->categoryType->key => $a->categoryValue->key]
            )->toArray(),
            ...($item->details ?? []),
        ];
    }

    private function resolveImageUrls(array $images): array
    {
        if (count($images) === 0) {
            return [];
        }

        $ids = collect($images)
            ->filter(fn ($value) => is_int($value) || (is_string($value) && ctype_digit($value)))
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values();

        $urlsById = $ids->isEmpty()
            ? []
            : GalleryImage::query()
                ->whereIn('id', $ids->all())
                ->pluck('url', 'id')
                ->all();

        return collect($images)
            ->map(function ($value) use ($urlsById) {
                if (is_int($value) || (is_string($value) && ctype_digit($value))) {
                    return isset($urlsById[(int) $value])
                        ? $this->normalizeApiOutputPath($urlsById[(int) $value])
                        : null;
                }

                return is_string($value)
                    ? $this->normalizeApiOutputPath($value)
                    : null;
            })
            ->filter()
            ->values()
            ->all();
    }
}
