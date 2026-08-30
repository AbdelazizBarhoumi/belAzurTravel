<?php

namespace App\Console\Commands;

use App\Models\Hotel;
use App\Models\HotelDailyPrice;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use App\Services\OsTravel\OsTravelClient;
use App\Services\OsTravel\OsTravelPriceCalculator;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class FetchTomorrowHotelPrices extends Command
{
    protected $signature = 'hotels:fetch-tomorrow-prices';

    protected $description = 'Fetch tomorrow\'s hotel prices from OS-TRAVEL and store them as defaults';

    private const MAX_HOTELS_PER_REQUEST = 200;

    public function handle(
        OsTravelClient $client,
        OsTravelPriceCalculator $calculator,
        HotelPublisher $publisher,
    ): int {
        $tomorrow = Carbon::tomorrow()->toDateString();
        $checkOut = Carbon::tomorrow()->addDay()->toDateString();

        $lock = Cache::lock('hotel-daily-price-fetch', 900);
        if (! $lock->get()) {
            $this->info('Another price fetch is still in progress.');

            return self::SUCCESS;
        }

        try {
            $staged = OsTravelHotel::query()
                ->whereNotNull('hotel_id')
                ->with('hotel')
                ->get()
                ->keyBy('external_id');

            if ($staged->isEmpty()) {
                $this->info('No provider-linked hotels found.');

                return self::SUCCESS;
            }

            $externalIds = $staged->keys()->all();
            $chunks = array_chunk($externalIds, self::MAX_HOTELS_PER_REQUEST);
            $throttleMs = (int) config('ostravel.search.throttle_ms', 150);

            $fetched = 0;
            $failed = 0;
            $results = [];

            foreach ($chunks as $index => $chunk) {
                if ($index > 0 && $throttleMs > 0) {
                    usleep($throttleMs * 1000);
                }

                try {
                    $envelope = $client->hotelSearch([
                        'BookingDetails' => [
                            'CheckIn' => $tomorrow,
                            'CheckOut' => $checkOut,
                            'Hotels' => array_map('intval', $chunk),
                        ],
                        'Filters' => [
                            'OnlyAvailable' => true,
                        ],
                        'Rooms' => [['Adult' => 1, 'Child' => []]],
                    ]);
                } catch (Throwable $e) {
                    Log::warning('OS-TRAVEL HotelSearch chunk failed during daily price fetch.', [
                        'hotels' => $chunk,
                        'error' => $e->getMessage(),
                    ]);
                    $failed += count($chunk);

                    continue;
                }

                foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                    $externalId = (string) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? '');
                    $item = $staged->get($externalId);

                    if ($item === null || $item->hotel === null) {
                        continue;
                    }

                    $minRoom = $this->findCheapestRoom($providerHotel);

                    if ($minRoom === null) {
                        continue;
                    }

                    $markup = (float) $item->hotel->markup_percentage;
                    $markedUpPrice = $calculator->applyMarkup($minRoom['price'], $markup);
                    $markedUpBasePrice = $calculator->applyMarkup($minRoom['base_price'], $markup);
                    $currency = $calculator->currency($providerHotel['Currency'] ?? $item->hotel->currency);

                    $results[] = [
                        'hotel_id' => $item->hotel_id,
                        'date' => $tomorrow,
                        'price' => $markedUpPrice,
                        'base_price' => $markedUpBasePrice,
                        'currency' => $currency,
                        'fetched_at' => now(),
                    ];
                    $fetched++;

                    // Assign pricing_type from boarding codes so the
                    // filter sidebar has correct counts even when the
                    // daily-price shortcut path omits room details.
                    $boarding = $providerHotel['Price']['Boarding'] ?? [];
                    $publisher->assignPricingType($item->hotel, $boarding);
                }
            }

            if ($results !== []) {
                foreach ($results as $row) {
                    HotelDailyPrice::updateOrCreate(
                        ['hotel_id' => $row['hotel_id'], 'date' => $row['date']],
                        $row,
                    );

                    Hotel::where('id', $row['hotel_id'])->update([
                        'price' => $row['price'],
                        'base_price' => $row['base_price'],
                    ]);
                }
            }

            // Clean up prices older than 3 days
            HotelDailyPrice::where('date', '<', Carbon::today()->subDays(3)->toDateString())->delete();

            $this->info("Fetched prices for {$fetched} hotels (tomorrow: {$tomorrow}). Failed: {$failed}.");

            return self::SUCCESS;
        } catch (Throwable $e) {
            Log::error('Daily hotel price fetch failed.', ['error' => $e->getMessage()]);
            $this->error("Price fetch failed: {$e->getMessage()}");

            return self::FAILURE;
        } finally {
            $lock->release();
        }
    }

    /**
     * Find the cheapest bookable room from a provider hotel response.
     */
    private function findCheapestRoom(array $providerHotel): ?array
    {
        $best = null;

        foreach ($providerHotel['Price']['Boarding'] ?? [] as $boarding) {
            foreach ($boarding['Pax'] ?? [] as $pax) {
                foreach ($pax['Rooms'] ?? [] as $room) {
                    if (isset($room['StopReservation']) && (bool) $room['StopReservation']) {
                        continue;
                    }

                    $price = $room['Price'] ?? null;
                    if ($price === null || ! is_numeric($price)) {
                        continue;
                    }

                    $price = (float) $price;
                    $basePrice = (float) ($room['BasePrice'] ?? $room['Price'] ?? $price);

                    if ($best === null || $price < $best['price']) {
                        $best = ['price' => $price, 'base_price' => $basePrice];
                    }
                }
            }
        }

        return $best;
    }
}
