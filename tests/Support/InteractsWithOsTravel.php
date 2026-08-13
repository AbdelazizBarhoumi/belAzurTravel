<?php

namespace Tests\Support;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

trait InteractsWithOsTravel
{
    protected function setUpOsTravelConfig(): void
    {
        Config::set('ostravel.base_url', 'https://admin.mygo.co');
        Config::set('ostravel.login', 'XMLBEL');
        Config::set('ostravel.password', 'test-password');
        Config::set('ostravel.timeout', 30);
        Config::set('ostravel.retry', [
            'times' => 3,
            'sleep' => 0,
            'when' => [429, 500, 502, 503, 504],
        ]);
        Config::set('ostravel.sync.throttle_ms', 0);
        Config::set('ostravel.search.throttle_ms', 0);
        Config::set('ostravel.sync.lock_ttl_minutes', 180);
    }

    protected function osTravelFixture(string $name): array
    {
        return json_decode(
            file_get_contents(base_path("tests/Fixtures/os_travel_{$name}.json")),
            true,
            flags: JSON_THROW_ON_ERROR
        );
    }

    /**
     * Fake the full country → city → boarding/category/currency → hotel → detail
     * chain. Each value is the raw fixture body; `ListHotel` may also be a
     * `Http::sequence()` for pagination scenarios.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function fakeOsTravelChain(array $overrides = []): void
    {
        $chain = array_merge([
            'ListCountry' => $this->osTravelFixture('list_country'),
            'ListCity' => $this->osTravelFixture('list_city'),
            'ListBoarding' => $this->osTravelFixture('list_boarding'),
            'ListCategorie' => $this->osTravelFixture('list_categorie'),
            'ListCurrency' => $this->osTravelFixture('list_currency'),
            'ListHotel' => $this->osTravelFixture('list_hotel'),
            'HotelDetail' => $this->osTravelFixture('hotel_detail'),
        ], $overrides);

        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response($chain['ListCountry']),
            'https://admin.mygo.co/api/hotel/ListCity' => Http::response($chain['ListCity']),
            'https://admin.mygo.co/api/hotel/ListBoarding' => Http::response($chain['ListBoarding']),
            'https://admin.mygo.co/api/hotel/ListCategorie' => Http::response($chain['ListCategorie']),
            'https://admin.mygo.co/api/hotel/ListCurrency' => Http::response($chain['ListCurrency']),
            'https://admin.mygo.co/api/hotel/ListHotel' => is_array($chain['ListHotel'])
                ? Http::response($chain['ListHotel'])
                : $chain['ListHotel'],
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response($chain['HotelDetail']),
        ]);
    }

    protected function osTravelHotelItem(int $id, string $name): array
    {
        return [
            'Id' => $id,
            'Name' => $name,
            'Category' => ['Id' => 2, 'Title' => '4 étoiles', 'Star' => 4],
            'City' => ['Id' => 12, 'Name' => 'Kelibia', 'Country' => ['Id' => 219, 'Name' => 'Tunisie']],
            'Image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'Theme' => [],
        ];
    }
}
