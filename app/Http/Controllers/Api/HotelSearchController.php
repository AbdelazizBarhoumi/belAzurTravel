<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
            'city_id' => ['nullable', 'string', 'max:50'],
            'stars' => ['nullable', 'integer', 'between:1,5'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer'],
            'boarding_ids' => ['nullable', 'array'],
            'boarding_ids.*' => ['integer'],
            'price_min' => ['nullable', 'integer', 'min:0'],
            'price_max' => ['nullable', 'integer', 'min:0', 'gte:price_min'],
            'sort' => ['nullable', 'in:price_asc,price_desc,stars_desc'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ]);

        if (
            Carbon::parse($data['check_in'])->diffInDays(Carbon::parse($data['check_out'])) > 30
        ) {
            throw ValidationException::withMessages([
                'check_out' => 'The stay cannot exceed 30 nights.',
            ]);
        }

        $slugs = array_values(array_unique(array_filter($data['hotel_slugs'] ?? [])));
        $perPage = (int) ($data['per_page'] ?? 10);
        $page = (int) ($data['page'] ?? 1);

        try {
            $results = $this->searchService->search($slugs, [
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'] ?? [],
                'only_available' => $data['only_available'] ?? true,
                'city_id' => $data['city_id'] ?? null,
                'stars' => $data['stars'] ?? null,
                'category_ids' => $data['category_ids'] ?? [],
                'boarding_ids' => $data['boarding_ids'] ?? [],
                'price_min' => $data['price_min'] ?? null,
                'price_max' => $data['price_max'] ?? null,
                'sort' => $data['sort'] ?? 'price_asc',
            ]);
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'search' => 'Live pricing is temporarily unavailable. Please try again shortly.',
            ]);
        }

        $total = count($results);
        $lastPage = max(1, (int) ceil($total / $perPage));
        $sliced = array_slice($results, ($page - 1) * $perPage, $perPage);

        $stayPrices = array_values(array_filter(
            array_map(fn ($r) => $r['price'] ?? null, $results),
        ));
        $minPrice = $stayPrices !== [] ? (int) floor(min($stayPrices)) : null;
        $maxPrice = $stayPrices !== [] ? (int) ceil(max($stayPrices)) : null;

        return response()->json([
            'data' => $sliced,
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'total' => $total,
                'per_page' => $perPage,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
            ],
        ]);
    }
}
