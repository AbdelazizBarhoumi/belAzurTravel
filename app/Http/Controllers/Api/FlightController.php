<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FlightController extends Controller
{
    use HandlesAdminMedia;

    public function index(Request $request): JsonResponse
    {
        $hasFilters = $request->hasAny([
            'from', 'to', 'tripType', 'directOnly', 'baggageIncluded',
            'cabinClass', 'departureDate', 'returnDate', 'passengers', 'flexibility',
        ]);

        if ($hasFilters) {
            $result = $this->filteredFlights($request);
        } else {
            $result = Cache::remember(
                'entity.flights.index',
                now()->addMinutes(10),
                fn () => Flight::query()->with('segments')->oldest('id')->get()->map(
                    fn (Flight $item) => $this->payload($item)
                )
            );
        }

        return response()->json($result);
    }

    public function show(string $code): JsonResponse
    {
        $item = Flight::query()->with('segments')->where('code', $code)->firstOrFail();

        return response()->json(Cache::remember(
            "entity.flights.{$code}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    private function filteredFlights(Request $request): array
    {
        $query = Flight::query()->with('segments');

        // Filter by departure IATA code
        if ($request->filled('from')) {
            $query->where('from', $request->input('from'));
        }

        // Filter by destination IATA code
        if ($request->filled('to')) {
            $query->where('to', $request->input('to'));
        }

        // Filter by trip type
        if ($request->filled('tripType')) {
            $query->where('trip_type', $request->input('tripType'));
        }

        // Filter direct-only flights
        if ($request->boolean('directOnly')) {
            $query->where(function ($q) {
                $q->where('direct_only', true)
                    ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(stops, '$.en')) LIKE ?", ['%irect%']);
            });
        }

        // Filter baggage-included flights
        if ($request->boolean('baggageIncluded')) {
            $query->where('baggage_included', true);
        }

        // Filter by cabin class (stored in details JSON)
        if ($request->filled('cabinClass')) {
            $cabinClass = $request->input('cabinClass');
            $query->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(details, '$.cabin.en')) = ?", [$cabinClass]);
        }

        // Filter by departure date with optional flexibility
        $flexibility = (int) $request->input('flexibility', 0);
        if ($request->filled('departureDate')) {
            $date = $request->input('departureDate');
            $fromDate = now()->parse($date)->subDays($flexibility)->toDateString();
            $toDate = now()->parse($date)->addDays($flexibility)->toDateString();
            $query->where(function ($q) use ($fromDate, $toDate) {
                $q->whereNull('date_from')
                    ->orWhereBetween('date_from', [$fromDate, $toDate])
                    ->orWhereBetween('date_to', [$fromDate, $toDate]);
            });
        }

        if ($request->filled('returnDate')) {
            $date = $request->input('returnDate');
            $fromDate = now()->parse($date)->subDays($flexibility)->toDateString();
            $toDate = now()->parse($date)->addDays($flexibility)->toDateString();
            $query->where(function ($q) use ($fromDate, $toDate) {
                $q->whereNull('date_to')
                    ->orWhereBetween('date_to', [$fromDate, $toDate]);
            });
        }

        // Filter by minimum seats
        if ($request->filled('passengers')) {
            $passengers = (int) $request->input('passengers');
            $query->where(function ($q) use ($passengers) {
                $q->whereNull("details.seats")
                    ->orWhereRaw("CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.seats')) AS UNSIGNED) >= ?", [$passengers]);
            });
        }

        return $query->oldest('id')->get()->map(
            fn (Flight $item) => $this->payload($item)
        )->all();
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

        $segments = $item->segments ?? collect();

        return [
            'id' => $item->code,
            'code' => $item->code,
            'trip_type' => $item->trip_type,
            'direct_only' => $item->direct_only,
            'baggage_included' => $item->baggage_included,
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
            'segments' => $segments->map(fn ($seg) => [
                'segment_order' => $seg->segment_order,
                'from_airport' => $seg->from_airport,
                'to_airport' => $seg->to_airport,
                'departure_time' => $seg->departure_time,
                'arrival_time' => $seg->arrival_time,
                'date' => $seg->date?->format('Y-m-d'),
                'duration' => $seg->duration,
            ])->all(),
        ];
    }
}
