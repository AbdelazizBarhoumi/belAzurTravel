<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DestinationController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'destinations.index',
            now()->addMinutes(10),
            function() {
                return Destination::query()->oldest('id')->get()->map(
                    fn (Destination $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Destination::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "destinations.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Destination $item): array
    {
        return [
            'id' => $item->slug,
            'slug' => $item->slug,
            'name' => $item->name,
            'country' => $item->country,
            'image' => $item->image,
            'gallery' => $item->details['gallery'] ?? [$item->image],
            'rating' => $item->rating,
            'price' => $item->price,
            'categoryKey' => $item->category_key,
            'category' => $item->category,
            'description' => $item->description,
            ...($item->details ?? []),
        ];
    }
}

