<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class TourController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'tours.index',
            now()->addMinutes(10),
            function () {
                return Tour::query()->oldest('id')->get()->map(
                    fn (Tour $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Tour::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "tours.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Tour $item): array
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
