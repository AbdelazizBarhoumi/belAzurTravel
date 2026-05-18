<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PromoController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'promos.index',
            now()->addMinutes(10),
            function() {
                return Promo::query()->oldest('id')->get()->map(
                    fn (Promo $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $code): JsonResponse
    {
        $item = Promo::query()->where('code', $code)->firstOrFail();

        return response()->json(Cache::remember(
            "promos.{$code}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Promo $item): array
    {
        return [
            'code' => $item->code,
            'title' => $item->title,
            'discount' => $item->discount,
            'description' => $item->description,
            'expires' => $item->expires,
            'color' => $item->color,
            ...($item->details ?? []),
        ];
    }
}

