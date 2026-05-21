<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HotelController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'hotels.index',
            now()->addMinutes(10),
            function() {
                return Hotel::query()->oldest('id')->get()->map(
                    fn (Hotel $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Hotel::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "hotels.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Hotel $item): array
    {
        return [
            'id' => $item->slug,
            'slug' => $item->slug,
            'destinationSlug' => $item->destination_slug,
            'name' => $item->name,
            'location' => $item->location,
            'price' => $item->price,
            'rating' => $item->rating,
            'stars' => $item->stars,
            'reviews' => $item->reviews,
            'image' => $item->image ? asset('storage/' . $item->image) : null,
            'amenities' => $item->amenities,
            'tags' => $item->tags,
            ...($item->details ?? []),
        ];
    }
}

