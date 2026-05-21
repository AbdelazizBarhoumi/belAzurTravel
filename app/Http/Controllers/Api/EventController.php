<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'events.index',
            now()->addMinutes(10),
            function() {
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
            'title' => $item->title,
            'location' => $item->location,
            'date' => $item->date,
            'image' => $item->image ? asset('storage/' . $item->image) : null,
            'description' => $item->description,
            'price' => $item->price,
            ...($item->details ?? []),
        ];
    }
}

