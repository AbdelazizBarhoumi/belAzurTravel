<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HotelSearchController extends Controller
{
    public function __construct(
        private readonly OsTravelSearchService $searchService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'hotel_slugs' => ['nullable', 'array', 'max:200'],
            'hotel_slugs.*' => ['string'],
            'rooms' => ['nullable', 'array', 'min:1', 'max:8'],
            'rooms.*.adults' => ['nullable', 'integer', 'between:1,10'],
            'rooms.*.children' => ['nullable', 'array'],
            'rooms.*.children.*' => ['integer', 'between:0,17'],
            'only_available' => ['nullable', 'boolean'],
        ]);

        $slugs = array_values(array_unique(array_filter($data['hotel_slugs'] ?? [])));

        try {
            $results = $this->searchService->search($slugs, [
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'] ?? [],
                'only_available' => $data['only_available'] ?? true,
            ]);
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'search' => 'Live pricing is temporarily unavailable. Please try again shortly.',
            ]);
        }

        return response()->json(['data' => $results]);
    }
}
