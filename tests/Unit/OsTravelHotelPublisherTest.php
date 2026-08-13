<?php

namespace Tests\Unit;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelHotelPublisherTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
        Storage::fake('public');
        Http::fake([
            'https://admin.mygo.co/file_manager/*' => Http::response('image-bytes'),
        ]);
    }

    private function stagedHotel(int $id = 178, string $name = 'Cap Bon Kelibia Beach Hotel & Spa', ?int $basePrice = 250): OsTravelHotel
    {
        $detail = $this->osTravelFixture('hotel_detail');

        return OsTravelHotel::create([
            'external_id' => (string) $id,
            'payload' => [
                'ListHotel' => $this->osTravelHotelItem($id, $name),
                'HotelDetail' => $detail['HotelDetail'],
            ],
            'payload_hash' => str_repeat('a', 64),
            'name' => $name,
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PENDING,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
        ]);
    }

    public function test_publish_maps_staged_hotel_into_hotels_row(): void
    {
        $staged = $this->stagedHotel();

        $hotel = app(HotelPublisher::class)->publish($staged);

        $this->assertSame('ostravel-178', $hotel->code);
        $this->assertSame('cap-bon-kelibia-beach-hotel-spa', $hotel->slug);
        $this->assertSame([
            'en' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'fr' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'ar' => 'Cap Bon Kelibia Beach Hotel & Spa',
        ], $hotel->name);
        $this->assertSame(['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'], $hotel->location);
        $this->assertSame(4, $hotel->stars);
        $this->assertSame('20.00', (string) $hotel->markup_percentage);
        $this->assertSame('TND', $hotel->currency);
        $this->assertSame(300, $hotel->price);
        $this->assertSame(250, $hotel->base_price);
        $this->assertSame([], $hotel->tags);
        $this->assertSame('ostravel', $hotel->details['source']);
        $this->assertSame('178', $hotel->details['provider_hotel_id']);
        $this->assertSame(sha1('https://admin.mygo.co/file_manager/source/photos/test.jpg'), $hotel->meta['image_hash']);
        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
        $this->assertNotEmpty($hotel->details['gallery']);
    }

    public function test_publish_uses_markup_override_and_currency_override(): void
    {
        $staged = $this->stagedHotel();

        $hotel = app(HotelPublisher::class)->publish($staged, [
            'markup_percentage' => 15,
            'currency' => 'EUR',
        ]);

        $this->assertSame('15.00', (string) $hotel->markup_percentage);
        $this->assertSame('EUR', $hotel->currency);
        $this->assertSame(288, $hotel->price);

        $staged->refresh();
        $this->assertSame('15.00', (string) $staged->markup_percentage);
        $this->assertSame('EUR', $staged->currency);
    }

    public function test_republish_updates_in_place_without_duplicating_and_carries_base_price(): void
    {
        $staged = $this->stagedHotel();

        $first = app(HotelPublisher::class)->publish($staged);
        $second = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertSame(1, Hotel::count());
        $this->assertSame($first->id, $second->id);
        $this->assertSame(250, $second->base_price);
        $this->assertSame(300, $second->price);
    }

    public function test_publish_flushes_entity_and_admin_hotel_cache(): void
    {
        foreach ([
            'admin.entity.hotels',
            'entity.hotels.index',
            'hotels.index',
            'entity.hotels.cap-bon-kelibia-beach-hotel-spa',
            'hotels.cap-bon-kelibia-beach-hotel-spa',
        ] as $key) {
            Cache::put($key, 'stale', 60);
        }

        app(HotelPublisher::class)->publish($this->stagedHotel());

        foreach ([
            'admin.entity.hotels',
            'entity.hotels.index',
            'hotels.index',
            'entity.hotels.cap-bon-kelibia-beach-hotel-spa',
            'hotels.cap-bon-kelibia-beach-hotel-spa',
        ] as $key) {
            $this->assertFalse(Cache::has($key));
        }
    }

    public function test_publish_throws_when_base_price_is_missing(): void
    {
        $staged = $this->stagedHotel(basePrice: null);

        try {
            app(HotelPublisher::class)->publish($staged);
            $this->fail('Expected InvalidArgumentException to be thrown.');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('base_price', $e->getMessage());
        }

        $this->assertSame(0, Hotel::count());
        $this->assertSame(OsTravelHotel::PENDING, $staged->fresh()->status);
    }
}
