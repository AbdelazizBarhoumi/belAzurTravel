<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class TourController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'tours.index',
            now()->addMinutes(10),
            function() {
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
            'image' => $item->image,
            'description' => $item->description,
            'type' => data_get($item, 'details.type') ?? null,
            'durationDays' => $item->duration_days,
            'durationNights' => $item->duration_nights,
            'images' => $item->images ?? data_get($item, 'details.images'),
            'tags' => data_get($item, 'details.tags') ?? null,
            'itinerary' => $item->itinerary ?? data_get($item, 'details.itinerary'),
            'inclusions' => $item->includes ?? data_get($item, 'details.inclusions'),
            'excludes' => $item->excludes ?? data_get($item, 'details.excludes'),
            ...($item->details ?? []),
        ];
    }
}

