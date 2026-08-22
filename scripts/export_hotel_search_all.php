<?php

use App\Services\OsTravel\OsTravelClient;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Carbon;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$client = new OsTravelClient;
$maxPerRequest = 200;
$checkIn = Carbon::today()->addDay()->toDateString();
$checkOut = Carbon::parse($checkIn)->addDays(7)->toDateString();
$rooms = [['Adult' => 1, 'Child' => []]];

$result = [
    'generated_at' => now()->toIso8601String(),
    'search' => [
        'check_in' => $checkIn,
        'check_out' => $checkOut,
        'rooms' => $rooms,
        'only_available' => false,
    ],
    'hotels' => [],
];

$countryEnvelope = $client->listCountries();
$countries = $countryEnvelope['ListCountry'] ?? [];

foreach ($countries as $country) {
    $countryId = (string) ($country['Id'] ?? '');
    $countryName = $country['Name'] ?? $countryId;

    echo "Country: {$countryName} ({$countryId})\n";

    $cityEnvelope = $client->listCities($countryId);
    $cities = $cityEnvelope['ListCity'] ?? [];

    foreach ($cities as $city) {
        $cityId = (string) ($city['Id'] ?? '');
        $cityName = $city['Name'] ?? $cityId;

        echo "  City: {$cityName} ({$cityId})\n";

        $hotelIds = [];

        $hotelEnvelope = $client->listHotels($cityId);
        foreach ($hotelEnvelope['ListHotel'] ?? [] as $hotel) {
            $id = $hotel['Id'] ?? null;
            if ($id !== null && $id !== '') {
                $hotelIds[] = (int) $id;
            }
        }

        foreach (array_chunk($hotelIds, $maxPerRequest) as $chunk) {
            $envelope = $client->hotelSearch([
                'BookingDetails' => [
                    'CheckIn' => $checkIn,
                    'CheckOut' => $checkOut,
                    'Hotels' => $chunk,
                ],
                'Filters' => [
                    'OnlyAvailable' => false,
                ],
                'Rooms' => $rooms,
            ]);

            $returnedById = [];
            foreach ($envelope['HotelSearch'] ?? [] as $providerHotel) {
                $id = (int) ($providerHotel['Hotel']['Id'] ?? $providerHotel['Id'] ?? 0);
                $returnedById[$id] = $providerHotel;
            }

            foreach ($chunk as $hotelId) {
                $providerHotel = $returnedById[$hotelId] ?? null;

                $result['hotels'][] = [
                    'country_id' => $countryId,
                    'country_name' => $countryName,
                    'city_id' => $cityId,
                    'city_name' => $cityName,
                    'hotel_id' => $hotelId,
                    'hotel_name' => $providerHotel['Hotel']['Name'] ?? $providerHotel['Name'] ?? null,
                    'returned' => $providerHotel !== null,
                    'response' => $providerHotel,
                ];
            }

            usleep(150 * 1000);
        }
    }
}

$path = $app->storagePath('app/os_travel_hotel_search_all.json');
file_put_contents($path, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

$returned = count(array_filter($result['hotels'], fn ($h) => $h['returned']));
echo "\nWritten to {$path}\n";
echo 'Hotels total: '.count($result['hotels']).", returned: {$returned}\n";
