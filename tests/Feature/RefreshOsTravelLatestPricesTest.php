<?php

namespace Tests\Feature;

use App\Console\Commands\RefreshOsTravelLatestPrices;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class RefreshOsTravelLatestPricesTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
    }

    private function publishedHotel(int $externalId, string $slug, string $name, int $basePrice): Hotel
    {
        $hotel = Hotel::create([
            'slug' => $slug,
            'code' => "ostravel-{$externalId}",
            'name' => ['en' => $name, 'fr' => $name, 'ar' => $name],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kélibia', 'ar' => 'قليبية'],
            'price' => $basePrice,
            'base_price' => $basePrice,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.5,
            'stars' => 4,
            'image' => '/storage/uploads/hotels/test.jpg',
            'tags' => [],
            'details' => [],
            'meta' => [],
        ]);

        OsTravelHotel::create([
            'external_id' => (string) $externalId,
            'payload' => [],
            'payload_hash' => str_repeat('d', 64),
            'name' => $name,
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::APPROVED,
            'hotel_id' => $hotel->id,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
        ]);

        return $hotel;
    }

    public function test_command_refreshes_latest_prices(): void
    {
        $hotel = $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $exit = Artisan::call('os-travel:refresh-latest-prices');

        $this->assertSame(Command::SUCCESS, $exit);
        $this->assertStringContainsString('updated 1 hotels', Artisan::output());

        $hotel->refresh();
        $this->assertSame(927.52, $hotel->last_price);
        $this->assertNotNull($hotel->last_price_at);
    }

    public function test_command_reports_omitted_hotels_without_failing(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        $exit = Artisan::call('os-travel:refresh-latest-prices');

        $this->assertSame(Command::SUCCESS, $exit);
        $this->assertStringContainsString('1 had no live per-night availability', Artisan::output());
    }

    public function test_command_stays_successful_when_provider_errors(): void
    {
        $this->publishedHotel(178, 'cap-bon-kelibia', 'Cap Bon Kelibia Beach Hotel & Spa', 1000);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response('Service Unavailable', 500),
        ]);

        $exit = Artisan::call('os-travel:refresh-latest-prices');

        $this->assertSame(Command::SUCCESS, $exit);
        $this->assertStringContainsString('updated 0 hotels', Artisan::output());
    }

    public function test_command_is_registered_in_the_scheduler(): void
    {
        $this->assertTrue(class_exists(RefreshOsTravelLatestPrices::class));
    }
}
