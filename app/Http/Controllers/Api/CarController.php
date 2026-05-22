<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CarController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'cars.index',
            now()->addMinutes(10),
            function () {
                return Car::query()->oldest('id')->get()->map(
                    fn (Car $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Car::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "cars.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Car $item): array
    {
        $details = $item->details ?? [];

        return [
            'slug' => $item->slug,
            'name' => $item->name,
            'category_key' => $item->category_key,
            'category' => $item->category,
            'price' => $item->price,
            'seats' => $item->seats,
            'fuel' => $item->fuel,
            'transmission' => $item->transmission,
            'image' => $this->normalizeApiOutputPath($item->image),
            'gallery' => array_map(fn ($img) => $this->normalizeApiOutputPath($img), $details['gallery'] ?? []),
            'description' => $details['description'] ?? null,
            'features' => $details['features'] ?? [],
            'policy' => $details['policy'] ?? [],
        ];
    }
}
