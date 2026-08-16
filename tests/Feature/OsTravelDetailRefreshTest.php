<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelDetailRefreshTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $this->setUpOsTravelConfig();
        Storage::fake('public');
        Http::fake([
            'https://admin.mygo.co/file_manager/*' => Http::response('image-bytes'),
        ]);
        Cache::flush();
    }

    private function publishedHotel(): array
    {
        $detail = $this->osTravelFixture('hotel_detail');

        $staged = OsTravelHotel::create([
            'external_id' => '178',
            'payload' => [
                'ListHotel' => $this->osTravelHotelItem(178, 'Cap Bon Kelibia Beach Hotel & Spa'),
                'HotelDetail' => $detail['HotelDetail'],
            ],
            'payload_hash' => str_repeat('a', 64),
            'name' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::APPROVED,
            'base_price' => 250,
            'last_synced_at' => now(),
        ]);

        $hotel = Hotel::create([
            'slug' => 'cap-bon-kelibia-beach-hotel-spa',
            'code' => 'ostravel-178',
            'name' => ['en' => 'Cap Bon Kelibia Beach Hotel & Spa', 'fr' => 'Cap Bon Kelibia Beach Hotel & Spa', 'ar' => 'Cap Bon Kelibia Beach Hotel & Spa'],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'],
            'category' => ['en' => '4 étoiles', 'fr' => '4 étoiles', 'ar' => '4 étoiles'],
            'price' => 300,
            'base_price' => 250,
            'last_price' => 250,
            'last_price_at' => now(),
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.5,
            'stars' => 4,
            'image' => '/storage/uploads/hotels/test.jpg',
            'tags' => [],
            'details' => [
                'city' => ['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'],
                'country' => ['en' => 'Tunisie', 'fr' => 'Tunisie', 'ar' => 'Tunisie'],
                'description' => ['en' => 'A lovely resort by the sea.', 'fr' => 'A lovely resort by the sea.', 'ar' => 'A lovely resort by the sea.'],
                'gallery' => ['/storage/uploads/hotels/test.jpg'],
            ],
            'meta' => [],
        ]);

        $staged->update(['hotel_id' => $hotel->id]);

        return ['staged' => $staged, 'hotel' => $hotel];
    }

    public function test_first_public_visit_fetches_detail_once_and_persists_it(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response(
                $this->osTravelFixture('hotel_detail')
            ),
        ]);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();

        $staged = OsTravelHotel::first();
        $this->assertNotNull($staged->detail_fetched_at);
        $this->assertTrue($staged->detail_fetched_at->isToday());

        $hotel = Hotel::first();
        $this->assertSame('Spa et bien-être', $hotel->details['facilities'][0]['title']);
        $this->assertSame('Wifi gratuit', $hotel->details['amenity_tags'][0]['title']);
        $this->assertSame('178', $hotel->details['provider_hotel_id']);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/HotelDetail'));
    }

    public function test_same_day_visits_do_not_call_provider_again(): void
    {
        $this->publishedHotel();
        $staged = OsTravelHotel::first();
        $staged->update(['detail_fetched_at' => now()]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response(
                $this->osTravelFixture('hotel_detail')
            ),
        ]);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();
        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();

        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/HotelDetail'));
    }

    public function test_unclicked_hotels_are_never_refreshed(): void
    {
        $this->publishedHotel();

        // A second published hotel that is never visited must not be fetched.
        $detail = $this->osTravelFixture('hotel_detail');
        $staged = OsTravelHotel::create([
            'external_id' => '999',
            'payload' => [
                'ListHotel' => $this->osTravelHotelItem(999, 'Never Clicked'),
                'HotelDetail' => $detail['HotelDetail'],
            ],
            'payload_hash' => str_repeat('b', 64),
            'name' => 'Never Clicked',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::APPROVED,
            'last_synced_at' => now(),
        ]);

        Hotel::create([
            'slug' => 'never-clicked',
            'code' => 'ostravel-999',
            'name' => ['en' => 'Never Clicked', 'fr' => 'Never Clicked', 'ar' => 'Never Clicked'],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'],
            'category' => ['en' => '4 étoiles', 'fr' => '4 étoiles', 'ar' => '4 étoiles'],
            'price' => 200,
            'base_price' => 160,
            'last_price' => 160,
            'last_price_at' => now(),
            'currency' => 'TND',
            'image' => '/storage/uploads/hotels/test.jpg',
            'details' => ['city' => ['en' => 'Kelibia'], 'country' => ['en' => 'Tunisie'], 'description' => ['en' => 'x'], 'gallery' => []],
            'meta' => [],
        ]);
        $staged->update(['hotel_id' => Hotel::where('slug', 'never-clicked')->first()->id]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response(
                $this->osTravelFixture('hotel_detail')
            ),
        ]);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();

        // Only the clicked hotel's HotelDetail is fetched (once); the never
        // clicked hotel must not be fetched nor refreshed.
        $detailCalls = Http::recorded(fn ($request) => str_contains($request->url(), '/HotelDetail'));
        $this->assertCount(1, $detailCalls);
        $this->assertNotNull(OsTravelHotel::where('external_id', '178')->value('detail_fetched_at'));
        $this->assertNull(OsTravelHotel::where('external_id', '999')->value('detail_fetched_at'));
    }

    public function test_provider_failure_keeps_existing_data_and_retries_later(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response([], 500),
        ]);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();

        $staged = OsTravelHotel::first();
        $this->assertNull($staged->detail_fetched_at);

        $hotel = Hotel::first();
        $this->assertSame(['en' => 'A lovely resort by the sea.', 'fr' => 'A lovely resort by the sea.', 'ar' => 'A lovely resort by the sea.'], $hotel->details['description']);
    }

    public function test_admin_show_triggers_refresh(): void
    {
        $this->publishedHotel();

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response(
                $this->osTravelFixture('hotel_detail')
            ),
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels/1')
            ->assertOk();

        $this->assertNotNull(OsTravelHotel::first()->detail_fetched_at);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/HotelDetail'));
    }

    public function test_gallery_is_reused_when_album_unchanged(): void
    {
        $this->publishedHotel();
        $staged = OsTravelHotel::first();
        $staged->update(['detail_fetched_at' => now()->subDay()]);
        $hotel = Hotel::first();
        $hotel->update(['details' => array_merge($hotel->details, [
            'gallery' => ['/storage/uploads/hotels/existing.jpg'],
            'gallery_sources' => [
                'https://admin.mygo.co/file_manager/source/photos/tunisie/Tunis/sheraton-tunis/5.png',
                'https://admin.mygo.co/file_manager/source/photos/tunisie/Tunis/sheraton-tunis/4.png',
                'https://admin.mygo.co/file_manager/source/photos/tunisie/Tunis/sheraton-tunis/3.png',
                'https://admin.mygo.co/file_manager/source/photos/tunisie/Tunis/sheraton-tunis/1.png',
            ],
        ])]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response(
                $this->osTravelFixture('hotel_detail')
            ),
            'https://admin.mygo.co/file_manager/*' => Http::response('new-bytes'),
        ]);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();

        $this->assertSame(['/storage/uploads/hotels/existing.jpg'], Hotel::first()->details['gallery']);
    }

    public function test_gallery_is_redownloaded_when_album_changed(): void
    {
        $this->publishedHotel();
        $staged = OsTravelHotel::first();
        $staged->update(['detail_fetched_at' => now()->subDay()]);
        $hotel = Hotel::first();
        $hotel->update(['details' => array_merge($hotel->details, ['gallery' => ['/storage/uploads/hotels/existing.jpg'], 'gallery_sources' => ['https://old.example.com/a.jpg']])]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelDetail' => Http::response(
                $this->osTravelFixture('hotel_detail')
            ),
            'https://admin.mygo.co/file_manager/*' => Http::response('new-bytes'),
        ]);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();

        $gallery = Hotel::first()->details['gallery'];
        $this->assertNotContains('/storage/uploads/hotels/existing.jpg', $gallery);
        $this->assertNotEmpty($gallery);
    }
}
