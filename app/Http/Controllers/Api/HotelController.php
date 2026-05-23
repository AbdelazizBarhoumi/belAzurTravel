<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Amenity;
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
                return Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities'])->oldest('id')->get()->map(
                    fn (Hotel $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities'])->where('slug', $slug)->firstOrFail();

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
            'amenities' => collect($item->amenities ?? [])->map(fn (Amenity $amenity) => [
                'name' => $amenity->name,
                'icon' => $amenity->icon,
            ])->values(),
            'tags' => $item->tags,
            'rooms' => collect($item->rooms ?? [])->map(fn ($room) => [
                'name' => is_object($room) ? [
                    'en' => $room->name_en ?? '',
                    'fr' => $room->name_fr ?? '',
                    'ar' => $room->name_ar ?? '',
                ] : ($room['name'] ?? []),
                'description' => is_object($room) ? [
                    'en' => $room->description_en ?? '',
                    'fr' => $room->description_fr ?? '',
                    'ar' => $room->description_ar ?? '',
                ] : ($room['description'] ?? []),
                'pricePerNight' => (float) (is_object($room) ? $room->price_per_night : ($room['price_per_night'] ?? 0)),
                'capacity' => (int) (is_object($room) ? $room->capacity : ($room['capacity'] ?? 0)),
                'size' => (float) (is_object($room) ? $room->size : ($room['size'] ?? 0)),
                'features' => is_object($room) ? $room->featureItems->pluck('label')->all() : ($room['features'] ?? []),
                'images' => is_object($room) ? array_map(fn ($img) => $this->normalizeApiOutputPath($img->path), $room->imageItems->all()) : (array) ($room['images'] ?? []),
            ])->values(),
            ...$details,
        ];
    }
}
