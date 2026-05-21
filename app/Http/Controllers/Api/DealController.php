<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DealController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'deals.index',
            now()->addMinutes(10),
            function() {
                return Deal::query()->oldest('id')->get()->map(
                    fn (Deal $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Deal::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "deals.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Deal $item): array
    {
        return [
            'slug' => $item->slug,
            'title' => $item->title,
            'description' => $item->description,
            'discount' => $item->discount,
            'expires' => $item->expires,
            'category' => $item->category,
            'highlights' => $item->details['highlights'] ?? [],
            'terms' => $item->details['terms'] ?? [],
        ];
    }
}

