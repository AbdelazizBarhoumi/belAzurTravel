<?php

namespace Tests\Unit;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class HotelPublisherSlugTest extends TestCase
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

    private function stagedHotel(int $id, string $name): OsTravelHotel
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
            'last_synced_at' => now(),
        ]);
    }

    public function test_duplicate_name_gets_unique_slug_with_external_id_suffix(): void
    {
        app(HotelPublisher::class)->publish($this->stagedHotel(1, 'Sheraton Tunis'));
        $second = app(HotelPublisher::class)->publish($this->stagedHotel(2, 'Sheraton Tunis'));

        $this->assertSame('sheraton-tunis', Hotel::where('code', 'ostravel-1')->first()->slug);
        $this->assertSame('sheraton-tunis-2', $second->slug);
    }

    public function test_manual_slug_override_is_preserved_on_republish(): void
    {
        $staged = $this->stagedHotel(1, 'Sheraton Tunis');
        $hotel = app(HotelPublisher::class)->publish($staged);
        $hotel->update(['slug' => 'luxury-sheraton-tunis']);

        $republished = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertSame('luxury-sheraton-tunis', $republished->slug);
    }

    public function test_republish_keeps_auto_generated_slug(): void
    {
        $staged = $this->stagedHotel(1, 'Sheraton Tunis');
        $first = app(HotelPublisher::class)->publish($staged);
        $second = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertSame('sheraton-tunis', $first->slug);
        $this->assertSame('sheraton-tunis', $second->slug);
        $this->assertSame(1, Hotel::count());
    }
}
