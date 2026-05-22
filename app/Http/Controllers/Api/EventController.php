<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class EventController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'events.index',
            now()->addMinutes(10),
            function () {
                return Event::query()->oldest('id')->get()->map(
                    fn (Event $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Event::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "events.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Event $item): array
    {
        return [
            'slug' => $item->slug,
            'category_key' => $item->category_key,
            'title' => $item->title,
            'location' => $item->location,
            'date' => $item->date,
            'image' => $this->normalizeApiOutputPath($item->image),
            'description' => $item->description,
            'price' => $item->price,
            ...($item->details ?? []),
        ];
    }
}
