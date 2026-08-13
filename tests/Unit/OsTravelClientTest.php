<?php

namespace Tests\Unit;

use App\Exceptions\OsTravelApiException;
use App\Services\OsTravel\OsTravelClient;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OsTravelClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('ostravel.base_url', 'https://admin.mygo.co');
        Config::set('ostravel.login', 'XMLBEL');
        Config::set('ostravel.password', 'test-password');
        Config::set('ostravel.timeout', 30);
        Config::set('ostravel.retry', [
            'times' => 3,
            'sleep' => 0,
            'when' => [429, 500, 502, 503, 504],
        ]);
    }

    public function test_list_countries_returns_parsed_list(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response($this->fixture('list_country')),
        ]);

        $response = (new OsTravelClient)->listCountries();

        $this->assertArrayHasKey('ListCountry', $response);
        $this->assertCount(3, $response['ListCountry']);
        $this->assertSame('dz', $response['ListCountry'][0]['Code']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'ListCountry', []));
    }

    public function test_list_cities_sends_country_id(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCity' => Http::response($this->fixture('list_city')),
        ]);

        $response = (new OsTravelClient)->listCities('219');

        $this->assertCount(7, $response['ListCity']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'ListCity', ['Country' => '219']));
    }

    public function test_list_boardings_returns_parsed_list(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListBoarding' => Http::response($this->fixture('list_boarding')),
        ]);

        $response = (new OsTravelClient)->listBoardings();

        $this->assertCount(40, $response['ListBoarding']);
        $this->assertSame('LS', $response['ListBoarding'][0]['Code']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'ListBoarding', []));
    }

    public function test_list_categories_returns_parsed_list(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCategorie' => Http::response($this->fixture('list_categorie')),
        ]);

        $response = (new OsTravelClient)->listCategories();

        $this->assertCount(11, $response['ListCategorie']);
        $this->assertSame(4, $response['ListCategorie'][1]['Star']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'ListCategorie', []));
    }

    public function test_list_currencies_returns_parsed_list(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCurrency' => Http::response($this->fixture('list_currency')),
        ]);

        $response = (new OsTravelClient)->listCurrencies();

        $this->assertCount(4, $response['ListCurrency']);
        $this->assertSame('TND', $response['ListCurrency'][0]['Code']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'ListCurrency', []));
    }

    public function test_list_hotels_sends_city_id_and_returns_raw_envelope(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListHotel' => Http::response($this->fixture('list_hotel')),
        ]);

        $response = (new OsTravelClient)->listHotels('12');

        $this->assertArrayHasKey('ListHotel', $response);
        $this->assertArrayHasKey('CountResults', $response);
        $this->assertSame(1, $response['CountResults']);
        $this->assertSame('Cap Bon Kelibia Beach Hotel & Spa', $response['ListHotel'][0]['Name']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'ListHotel', ['City' => '12']));
    }

    public function test_hotel_detail_sends_hotel_id(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response($this->fixture('hotel_detail')),
        ]);

        $response = (new OsTravelClient)->hotelDetail('101');

        $this->assertSame('Sheraton Tunis Hotel', $response['HotelDetail']['Name']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'HotelDetail', ['Hotel' => '101']));
    }

    public function test_hotel_search_sends_search_details(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->fixture('hotel_search')),
        ]);

        $response = (new OsTravelClient)->hotelSearch([
            'BookingDetails' => ['CheckIn' => '2026-09-01', 'CheckOut' => '2026-09-08'],
        ]);

        $this->assertCount(2, $response['HotelSearch']);
        $this->assertSame(178, $response['HotelSearch'][0]['Id']);
        $this->assertSame('eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=', $response['HotelSearch'][0]['Token']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'HotelSearch', []));
    }

    public function test_booking_creation_sends_hotel_booking(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->fixture('booking_creation_confirm')),
        ]);

        $hotelBooking = [
            'City' => 10,
            'Hotel' => 100,
            'CheckIn' => '2026-09-01',
            'CheckOut' => '2026-09-05',
            'Source' => 'OS-TRAVEL-DIRECT',
            'Token' => 'eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=',
            'Rooms' => [['Id' => 501]],
        ];

        $response = (new OsTravelClient)->bookingCreation($hotelBooking);

        $this->assertSame(98765, $response['BookingCreation']['Id']);
        $this->assertSame('VOUCH-98765', $response['BookingCreation']['Voucher']['Num']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'BookingCreation', []));
        Http::assertSent(fn ($request) => $request->data()['HotelBooking']['Hotel'] === 100);
    }

    public function test_booking_cancellation_sends_booking_context(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::response($this->fixture('booking_cancellation_confirm')),
        ]);

        $booking = ['Id' => 98765, 'Hotel' => 100, 'City' => 10];

        $response = (new OsTravelClient)->bookingCancellation($booking);

        $this->assertSame('Cancelled', $response['BookingCancellation']['State']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'BookingCancellation', []));
        Http::assertSent(fn ($request) => $request->data()['Booking']['Id'] === 98765);
    }

    public function test_booking_list_sends_filters_and_paginator(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingList' => Http::response($this->fixture('booking_list')),
        ]);

        $response = (new OsTravelClient)->bookingList(['Hotel' => 100], 2);

        $this->assertCount(2, $response['BookingList']);
        $this->assertSame('Cancelled', $response['BookingList'][1]['State']);

        Http::assertSent(fn ($request) => $this->assertListRequest($request, 'BookingList', []));
        Http::assertSent(fn ($request) => $request->data()['Filters']['Hotel'] === 100);
        Http::assertSent(fn ($request) => $request->data()['Paginator']['Page'] === 2);
    }

    public function test_error_message_throws_typed_exception(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response([
                'ListCountry' => [],
                'ErrorMessage' => ['Code' => 400, 'Description' => 'Pas de tarifs disponible'],
            ]),
        ]);

        try {
            (new OsTravelClient)->listCountries();
            $this->fail('Expected OsTravelApiException to be thrown.');
        } catch (OsTravelApiException $e) {
            $this->assertSame('ListCountry', $e->endpoint());
            $this->assertSame(400, $e->status());
            $this->assertStringContainsString('Pas de tarifs disponible', $e->getMessage());
        }
    }

    public function test_retryable_status_is_retried_then_throws_after_exhaustion(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response('Service Unavailable', 503),
        ]);

        try {
            (new OsTravelClient)->listCountries();
            $this->fail('Expected OsTravelApiException to be thrown.');
        } catch (OsTravelApiException $e) {
            $this->assertSame(503, $e->status());
        }

        Http::assertSentCount(3);
    }

    public function test_retry_recovers_on_transient_failure(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::sequence()
                ->push('Service Unavailable', 503)
                ->push('Service Unavailable', 503)
                ->push($this->fixture('list_country')),
        ]);

        $response = (new OsTravelClient)->listCountries();

        $this->assertCount(3, $response['ListCountry']);
        Http::assertSentCount(3);
    }

    public function test_non_retryable_status_throws_immediately(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response('Not Found', 404),
        ]);

        try {
            (new OsTravelClient)->listCountries();
            $this->fail('Expected OsTravelApiException to be thrown.');
        } catch (OsTravelApiException $e) {
            $this->assertSame(404, $e->status());
        }

        Http::assertSentCount(1);
    }

    private function fixture(string $name): array
    {
        return json_decode(
            file_get_contents(base_path("tests/Fixtures/os_travel_{$name}.json")),
            true,
            flags: JSON_THROW_ON_ERROR
        );
    }

    private function assertListRequest($request, string $endpoint, array $extra): bool
    {
        $this->assertSame('POST', $request->method());
        $this->assertSame("https://admin.mygo.co/api/hotel/{$endpoint}", $request->url());
        $this->assertSame('XMLBEL', data_get($request->data(), 'Credential.Login'));
        $this->assertSame('test-password', data_get($request->data(), 'Credential.Password'));

        foreach ($extra as $key => $value) {
            $this->assertSame($value, $request->data()[$key]);
        }

        return true;
    }
}
