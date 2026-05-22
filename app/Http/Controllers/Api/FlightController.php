<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class FlightController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'entity.flights.index',
            now()->addMinutes(10),
            function () {
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
            "entity.flights.{$code}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Flight $item): array
    {
        $details = $item->details ?? [];
        $detailsPayload = [
            'date' => $details['date'] ?? '',
            'seats' => $details['seats'] ?? null,
            'cabin' => $details['cabin'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'aircraft' => $details['aircraft'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'baggage' => $details['baggage'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'refund' => $details['refund'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
        ];

        return [
            'id' => $item->code,
            'code' => $item->code,
            'airline' => $item->airline,
            'from' => $item->from,
            'to' => $item->to,
            'duration' => $item->duration,
            'price' => $item->price,
            'stops' => $item->stops,
            'departure' => $item->departure,
            'arrival' => $item->arrival,
            'image' => $this->normalizeApiOutputPath($item->image),
            'details' => $detailsPayload,
            'date' => $detailsPayload['date'],
            'seats' => $detailsPayload['seats'],
            'cabin' => $detailsPayload['cabin'],
            'aircraft' => $detailsPayload['aircraft'],
            'baggage' => $detailsPayload['baggage'],
            'refund' => $detailsPayload['refund'],
        ];
    }
}
