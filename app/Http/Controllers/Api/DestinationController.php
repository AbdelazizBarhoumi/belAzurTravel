<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DestinationController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'destinations.index',
            now()->addMinutes(10),
            function () {
                return Destination::query()->oldest('id')
                    ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
                    ->get()->map(
                        fn (Destination $item) => $this->payload($item)
                    );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Destination::query()->where('slug', $slug)
            ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
            ->firstOrFail();

        return response()->json(Cache::remember(
            "destinations.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Destination $item): array
    {
        $category = Category::where('entity_type', 'destinations')
            ->where('key', $item->category_key)
            ->first();

        return [
            'id' => $item->id,
            'slug' => $item->slug,
            'name' => $item->name,
            'country' => $item->country,
            'image' => $this->normalizeApiOutputPath($item->image),
            'gallery' => array_map(fn ($img) => $this->normalizeApiOutputPath($img), $item->details['gallery'] ?? [$item->image]),
            'rating' => $item->rating,
            'price' => $item->price,
            'categoryKey' => $item->category_key,
            'category' => $category
                ? $category->name
                : [
                    'en' => $item->category_key,
                    'fr' => $item->category_key,
                    'ar' => $item->category_key,
                ],
            'description' => $item->description,
            'category_assignments' => collect($item->categoryAssignments ?? [])->mapWithKeys(
                fn ($a) => [$a->categoryType->key => $a->categoryValue->key]
            )->toArray(),
            ...($item->details ?? []),
        ];
    }
}
