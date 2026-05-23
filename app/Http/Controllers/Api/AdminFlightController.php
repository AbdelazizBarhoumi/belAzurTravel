<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * AdminFlightController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload or string path.
 * - Gallery: send `gallery` as an array of paths and `gallery_files` as uploaded files.
 */
class AdminFlightController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.flights', now()->addMinutes(5), function () {
            return Flight::query()
                ->oldest('id')
                ->get()
                ->map(fn (Model $item) => $this->adminPayload($item))
                ->all();
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
        $item = $this->findFlight($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = $this->findFlight($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache('flights', $item->code ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = $this->findFlight($id);
        $identifier = $item->code ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('flights', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->normalizeLocalizedInputs($request, [
            'airline',
            'to',
            'duration',
            'stops',
            'cabin',
            'aircraft',
            'baggage',
            'refund',
        ]);

        $this->decodeJsonFields($request, ['gallery', 'cabin', 'aircraft', 'baggage', 'refund']);

        $rules = [
            'code' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'airline' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'airline_en' => $existing ? ['sometimes', 'nullable', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'airline_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'airline_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
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
            'departure' => ['sometimes', 'nullable', 'string', 'max:32'],
            'arrival' => ['sometimes', 'nullable', 'string', 'max:32'],
            'date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seats' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'gallery' => ['sometimes', 'nullable', 'array'],
            'gallery_files' => ['sometimes', 'array'],
            'gallery_files.*' => ['image', 'max:4096'],
        ];

        $data = $request->validate($rules);
        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $name = $localized('airline');
        $label = $name['en'] ?: ($data['code'] ?? 'flight');
        $code = $existing->code ?? ($data['code'] ?? Str::slug($label).'-'.Str::lower(Str::random(4)));

        $gallery = $this->handleGallery($request, $existing?->details['gallery'] ?? [], 'uploads/flights');

        return [
            'code' => $code,
            'airline' => $localized('airline', $label),
            'from' => $data['from'] ?? $existing?->from ?? '',
            'to' => $localized('to'),
            'duration' => $localized('duration'),
            'price' => (int) ($data['price'] ?? 0),
            'stops' => $localized('stops'),
            'departure' => $data['departure'] ?? $existing?->departure ?? '',
            'arrival' => $data['arrival'] ?? $existing?->arrival ?? '',
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/flights'),
            'details' => $this->flightDetails($data, $existing, $gallery),
        ];
    }

    private function adminPayload(Model $item): array
    {
        $details = $item->details ?? [];

        return [
            'id' => (string) $item->id,
            'code' => $item->code,
            'airline' => $item->airline,
            'airline_en' => $item->airline['en'] ?? '',
            'airline_fr' => $item->airline['fr'] ?? '',
            'airline_ar' => $item->airline['ar'] ?? '',
            'from' => $item->from,
            'from_en' => $item->from['en'] ?? '',
            'from_fr' => $item->from['fr'] ?? '',
            'from_ar' => $item->from['ar'] ?? '',
            'to' => $item->to,
            'to_en' => $item->to['en'] ?? '',
            'to_fr' => $item->to['fr'] ?? '',
            'to_ar' => $item->to['ar'] ?? '',
            'duration' => $item->duration,
            'duration_en' => $item->duration['en'] ?? '',
            'duration_fr' => $item->duration['fr'] ?? '',
            'duration_ar' => $item->duration['ar'] ?? '',
            'price' => $item->price,
            'stops' => $item->stops,
            'stops_en' => $item->stops['en'] ?? '',
            'stops_fr' => $item->stops['fr'] ?? '',
            'stops_ar' => $item->stops['ar'] ?? '',
            'departure' => $item->departure,
            'arrival' => $item->arrival,
            'image' => $this->normalizeApiOutputPath($item->image),
            'gallery' => $details['gallery'] ?? [$item->image],
            'date' => $details['date'] ?? '',
            'seats' => $details['seats'] ?? null,
            'details' => [
                'gallery' => $details['gallery'] ?? [$item->image],
                'date' => $details['date'] ?? '',
                'seats' => $details['seats'] ?? null,
                'cabin' => $details['cabin'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
                'aircraft' => $details['aircraft'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
                'baggage' => $details['baggage'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
                'refund' => $details['refund'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            ],
            'cabin' => $details['cabin'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'cabin_en' => $details['cabin']['en'] ?? '',
            'cabin_fr' => $details['cabin']['fr'] ?? '',
            'cabin_ar' => $details['cabin']['ar'] ?? '',
            'aircraft' => $details['aircraft'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'aircraft_en' => $details['aircraft']['en'] ?? '',
            'aircraft_fr' => $details['aircraft']['fr'] ?? '',
            'aircraft_ar' => $details['aircraft']['ar'] ?? '',
            'baggage' => $details['baggage'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'baggage_en' => $details['baggage']['en'] ?? '',
            'baggage_fr' => $details['baggage']['fr'] ?? '',
            'baggage_ar' => $details['baggage']['ar'] ?? '',
            'refund' => $details['refund'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'refund_en' => $details['refund']['en'] ?? '',
            'refund_fr' => $details['refund']['fr'] ?? '',
            'refund_ar' => $details['refund']['ar'] ?? '',
        ];
    }

    private function findFlight(int|string $id): Flight
    {
        return Flight::query()
            ->whereKey($id)
            ->orWhere('code', (string) $id)
            ->firstOrFail();
    }

    private function flightDetails(array $data, ?Model $existing, array $gallery): array
    {
        $details = $existing?->details ?? [];

        $details['gallery'] = $gallery;

        if (array_key_exists('date', $data)) {
            $details['date'] = $data['date'] ?? '';
        }

        if (array_key_exists('seats', $data)) {
            $details['seats'] = isset($data['seats']) ? (int) $data['seats'] : null;
        }

        foreach (['cabin', 'aircraft', 'baggage', 'refund'] as $key) {
            if (array_key_exists($key, $data) || array_key_exists($key.'_en', $data) || array_key_exists($key.'_fr', $data) || array_key_exists($key.'_ar', $data)) {
                $details[$key] = $this->localized($data, $key, (string) data_get($existing, "details.{$key}.en", ''));
            }
        }

        return $details;
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;

        return ['fr' => $data[$key.'_fr'] ?? $base ?? '', 'ar' => $data[$key.'_ar'] ?? $base ?? '', 'en' => $data[$key.'_en'] ?? $base ?? ''];
    }

    private function normalizeLocalizedInputs(Request $request, array $fields): void
    {
        foreach ($fields as $field) {
            $value = $request->input($field);

            if (! is_array($value)) {
                continue;
            }

            foreach (['en', 'fr', 'ar'] as $locale) {
                $localeKey = "{$field}_{$locale}";

                if (! $request->filled($localeKey)) {
                    $localeValue = $value[$locale] ?? null;
                    if (is_string($localeValue) || is_numeric($localeValue)) {
                        $request->merge([$localeKey => (string) $localeValue]);
                    }
                }
            }

            $request->merge([$field => $this->localizedBaseValue($value)]);
        }
    }

    private function localizedBaseValue(array $value): string
    {
        foreach (['en', 'fr', 'ar'] as $locale) {
            $candidate = $value[$locale] ?? null;
            if (is_string($candidate) || is_numeric($candidate)) {
                return (string) $candidate;
            }
        }

        foreach ($value as $candidate) {
            if (is_string($candidate) || is_numeric($candidate)) {
                return (string) $candidate;
            }
        }

        return '';
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget('admin.entity.flights');
        Cache::forget("entity.{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
        }
    }
}
