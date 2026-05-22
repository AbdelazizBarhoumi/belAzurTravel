<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HotelController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'hotels.index',
            now()->addMinutes(10),
            function () {
                return Hotel::query()->with('rooms', 'amenities')->oldest('id')->get()->map(
                    fn (Hotel $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Hotel::query()->with('rooms', 'amenities')->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "hotels.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Hotel $item): array
    {
        $details = $item->details ?? [];
        $category = $item->category ?? $details['category'] ?? ['en' => '', 'fr' => '', 'ar' => ''];
        if (isset($details['gallery']) && is_array($details['gallery'])) {
            $details['gallery'] = array_map(fn ($img) => $this->normalizeApiOutputPath($img), $details['gallery']);
        }

        return [
            'id' => $item->slug,
            'slug' => $item->slug,
            'destinationSlug' => $item->destination_slug,
            'name' => $item->name,
            'location' => $item->location,
            'category_key' => $item->category_key,
            'category' => $category,
            'price' => $item->price,
            'rating' => $item->rating,
            'stars' => $item->stars,
            'reviews' => $item->reviews,
            'image' => $this->normalizeApiOutputPath($item->image),
            'amenities' => $item->relationLoaded('amenities') && is_iterable($item->amenities) ? $item->amenities->map(fn ($amenity) => [
                'name' => $amenity->name,
                'icon' => $amenity->icon,
            ]) : [],
            'tags' => $item->tags,
            'rooms' => $item->relationLoaded('rooms') ? $item->rooms->map(fn ($room) => [
                'name' => $room->name,
                'description' => $room->description,
                'pricePerNight' => (float) $room->price_per_night,
                'capacity' => (int) $room->capacity,
                'size' => (float) $room->size,
                'features' => $room->features,
                'images' => array_map(fn ($img) => $this->normalizeApiOutputPath($img), $room->images ?? []),
            ]) : [],
            ...$details,
        ];
    }
}
