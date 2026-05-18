<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class FlightController extends Controller
{
    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'flights.index',
            now()->addMinutes(10),
            function() {
                return Flight::query()->oldest('id')->get()->map(
                    fn (Flight $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $code): JsonResponse
    {
        $item = Flight::query()->where('code', $code)->firstOrFail();

        return response()->json(Cache::remember(
            "flights.{$code}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Flight $item): array
    {
        return [
            'id' => $item->code,
            'airline' => $item->airline,
            'from' => $item->from,
            'to' => $item->to,
            'duration' => $item->duration,
            'price' => $item->price,
            'stops' => $item->stops,
            'departure' => $item->departure,
            'arrival' => $item->arrival,
            ...($item->details ?? []),
        ];
    }
}

