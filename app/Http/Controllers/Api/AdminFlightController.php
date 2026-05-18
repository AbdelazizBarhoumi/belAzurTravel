<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AdminFlightController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.flights', now()->addMinutes(5), function () {
            return Flight::query()->oldest('id')->get()->map(fn (Model $item) => $this->adminPayload($item));
        });
        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Flight::create($this->attributes($request));
        $this->flushAdminCache('flights', $item->code ?? null);
        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Flight::query()->findOrFail($id);
        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Flight::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('flights', $item->code ?? null);
        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Flight::query()->findOrFail($id);
        $identifier = $item->code ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('flights', $identifier);
        return response()->json(['message' => 'deleted']);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $rules = [
            'code' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'airline' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'airline_en' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'airline_fr' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'nullable', 'string', 'max:255'],
            'airline_ar' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'nullable', 'string', 'max:255'],
            'from' => ['sometimes', 'nullable', 'string', 'max:16'],
            'to' => ['sometimes', 'nullable', 'string', 'max:255'],
            'to_en' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'to_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'to_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_en' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'duration_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'stops' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stops_en' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'stops_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stops_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'departure' => ['sometimes', 'nullable', 'string', 'max:32'],
            'arrival' => ['sometimes', 'nullable', 'string', 'max:32'],
            'date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seats' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'cabin' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cabin_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cabin_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cabin_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aircraft' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aircraft_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aircraft_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aircraft_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'baggage' => ['sometimes', 'nullable', 'string', 'max:255'],
            'baggage_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'baggage_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'baggage_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'refund' => ['sometimes', 'nullable', 'string', 'max:255'],
            'refund_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'refund_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'refund_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            // localized detail sections handled above
        ];

        $data = $request->validate($rules);

        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $name = $localized('airline');
        $label = $name['en'] ?: ($data['code'] ?? 'flight');
        $code = $existing->code ?? ($data['code'] ?? Str::slug($label) . '-' . Str::lower(Str::random(4)));

        return [
            'code' => $code,
            'airline' => $localized('airline', $label),
            'from' => $data['from'] ?? '',
            'to' => $localized('to'),
            'duration' => $localized('duration'),
            'price' => (int) ($data['price'] ?? 0),
            'stops' => $localized('stops'),
            'departure' => $data['departure'] ?? '',
            'arrival' => $data['arrival'] ?? '',
            'details' => $this->flightDetails($data, $existing),
        ];
    }

    private function adminPayload(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            'code' => $item->code,
            ...$this->flatLocalized('airline', $item->airline),
            'from' => $item->from,
            ...$this->flatLocalized('to', $item->to),
            ...$this->flatLocalized('duration', $item->duration),
            'price' => $item->price,
            ...$this->flatLocalized('stops', $item->stops),
            'departure' => $item->departure,
            'arrival' => $item->arrival,
            'date' => $item->details['date'] ?? '',
            'seats' => $item->details['seats'] ?? null,
            ...$this->flatLocalized('cabin', $item->details['cabin'] ?? null),
            ...$this->flatLocalized('aircraft', $item->details['aircraft'] ?? null),
            ...$this->flatLocalized('baggage', $item->details['baggage'] ?? null),
            ...$this->flatLocalized('refund', $item->details['refund'] ?? null),
        ];
    }

    private function flightDetails(array $data, ?Model $existing): array
    {
        $details = $existing?->details ?? [];

        if (array_key_exists('date', $data)) {
            $details['date'] = $data['date'] ?? '';
        }

        if (array_key_exists('seats', $data)) {
            $details['seats'] = isset($data['seats']) ? (int) $data['seats'] : null;
        }

        foreach (['cabin', 'aircraft', 'baggage', 'refund'] as $key) {
            if (array_key_exists($key, $data) || array_key_exists($key.'_en', $data) || array_key_exists($key.'_fr', $data) || array_key_exists($key.'_ar', $data)) {
                $fallback = data_get($existing, "details.{$key}.en") ?? data_get($existing, "details.{$key}") ?? '';
                $details[$key] = $this->localized($data, $key, (string) $fallback);
            }
        }

        return $details;
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;
        return ['fr' => $data[$key.'_fr'] ?? $base ?? '', 'ar' => $data[$key.'_ar'] ?? $base ?? '', 'en' => $data[$key.'_en'] ?? $base ?? ''];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }
    }
}

