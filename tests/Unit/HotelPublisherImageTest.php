<?php

namespace Tests\Unit;

use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class HotelPublisherImageTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
        Storage::fake('public');
    }

    private function stagedHotel(string $image, int $id = 178): OsTravelHotel
    {
        $detail = $this->osTravelFixture('hotel_detail');
        $list = $this->osTravelHotelItem($id, 'Cap Bon Kelibia Beach Hotel & Spa');
        $list['Image'] = $image;

        return OsTravelHotel::create([
            'external_id' => (string) $id,
            'payload' => ['ListHotel' => $list, 'HotelDetail' => $detail['HotelDetail']],
            'payload_hash' => str_repeat('a', 64),
            'name' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => $image,
            'status' => OsTravelHotel::PENDING,
            'last_synced_at' => now(),
        ]);
    }

    private function countRequestsTo(string $prefix): int
    {
        return collect(Http::recorded())
            ->filter(fn (array $pair) => str_starts_with($pair[0]->url(), $prefix))
            ->count();
    }

    public function test_same_image_url_skips_download_on_republish(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('image-bytes'),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('https://93.184.216.34/photos/main.jpg');
        $first = app(HotelPublisher::class)->publish($staged);
        $this->assertSame(1, $this->countRequestsTo('https://93.184.216.34'));

        $republished = app(HotelPublisher::class)->publish($staged->refresh());
        $this->assertSame(1, $this->countRequestsTo('https://93.184.216.34'));

        $this->assertSame($first->image, $republished->image);
        $this->assertStringStartsWith('/storage/uploads/hotels/', $republished->image);
        $this->assertSame(sha1('https://93.184.216.34/photos/main.jpg'), $republished->meta['image_hash']);
    }

    public function test_changed_image_url_downloads_new_image(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('image-bytes'),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('https://93.184.216.34/photos/old.jpg');
        $first = app(HotelPublisher::class)->publish($staged);
        $this->assertSame(1, $this->countRequestsTo('https://93.184.216.34'));

        $payload = $staged->payload;
        $payload['ListHotel']['Image'] = 'https://93.184.216.34/photos/new.jpg';
        $staged->payload = $payload;
        $staged->save();

        $republished = app(HotelPublisher::class)->publish($staged->refresh());
        $this->assertSame(2, $this->countRequestsTo('https://93.184.216.34'));

        $this->assertNotSame($first->image, $republished->image);
        $this->assertSame(sha1('https://93.184.216.34/photos/new.jpg'), $republished->meta['image_hash']);
    }

    public function test_changed_image_url_deletes_the_replaced_local_file(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('image-bytes'),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('https://93.184.216.34/photos/old.jpg');
        $first = app(HotelPublisher::class)->publish($staged);
        $oldPath = ltrim($first->image, '/storage/');
        $this->assertTrue(Storage::disk('public')->exists($oldPath));

        $payload = $staged->payload;
        $payload['ListHotel']['Image'] = 'https://93.184.216.34/photos/new.jpg';
        $staged->payload = $payload;
        $staged->save();

        $republished = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertNotSame($first->image, $republished->image);
        $this->assertFalse(Storage::disk('public')->exists($oldPath));
        $this->assertTrue(Storage::disk('public')->exists(ltrim($republished->image, '/storage/')));
    }

    public function test_download_failure_keeps_the_old_file(): void
    {
        Storage::disk('public')->put('uploads/hotels/existing.jpg', 'image-bytes');

        Http::fake([
            'https://93.184.216.34/photos/old.jpg' => Http::response('image-bytes'),
            'https://93.184.216.34/photos/broken.jpg' => Http::response('', 500),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('https://93.184.216.34/photos/old.jpg');
        $first = app(HotelPublisher::class)->publish($staged);
        $oldPath = ltrim($first->image, '/storage/');

        $payload = $staged->payload;
        $payload['ListHotel']['Image'] = 'https://93.184.216.34/photos/broken.jpg';
        $staged->payload = $payload;
        $staged->save();

        $republished = app(HotelPublisher::class)->publish($staged->refresh());

        // The failed download keeps the previous local file; it must survive.
        $this->assertSame($first->image, $republished->image);
        $this->assertTrue(Storage::disk('public')->exists($oldPath));
    }

    public function test_download_failure_falls_back_to_remote_url(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('', 500),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('https://93.184.216.34/photos/broken.jpg');
        $hotel = app(HotelPublisher::class)->publish($staged);

        $this->assertSame('https://93.184.216.34/photos/broken.jpg', $hotel->image);
    }

    public function test_private_loopback_image_url_is_rejected_without_fetch(): void
    {
        Http::fake([
            'http://127.0.0.1/*' => Http::response('image-bytes'),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('http://127.0.0.1/secret.jpg');
        $hotel = app(HotelPublisher::class)->publish($staged);

        $this->assertSame('http://127.0.0.1/secret.jpg', $hotel->image);
        $this->assertSame(0, $this->countRequestsTo('http://127.0.0.1'));
    }

    public function test_private_rfc1918_image_url_is_rejected_without_fetch(): void
    {
        Http::fake([
            'http://10.0.0.8/*' => Http::response('image-bytes'),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        $staged = $this->stagedHotel('http://10.0.0.8/internal.jpg');
        $hotel = app(HotelPublisher::class)->publish($staged);

        $this->assertSame('http://10.0.0.8/internal.jpg', $hotel->image);
        $this->assertSame(0, $this->countRequestsTo('http://10.0.0.8'));
    }

    public function test_publish_reuses_the_local_image_stored_by_the_catalog_sync(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('image-bytes'),
            'https://admin.mygo.co/*' => Http::response('image-bytes'),
        ]);

        Storage::disk('public')->put('uploads/hotels/presynced.jpg', 'image-bytes');

        $staged = $this->stagedHotel('https://93.184.216.34/photos/main.jpg');
        $staged->update([
            'image' => '/storage/uploads/hotels/presynced.jpg',
            'image_source' => 'https://93.184.216.34/photos/main.jpg',
        ]);

        $hotel = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertSame('/storage/uploads/hotels/presynced.jpg', $hotel->image);
        $this->assertSame(0, $this->countRequestsTo('https://93.184.216.34'));
    }
}
