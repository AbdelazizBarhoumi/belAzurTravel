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

class OsTravelPublicFlowTest extends TestCase
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

    private function stagedHotel(int $id, string $name, string $status = OsTravelHotel::PENDING, ?int $basePrice = null): OsTravelHotel
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
            'status' => $status,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
            'detail_fetched_at' => now(),
        ]);
    }

    private function publishedHotel(): array
    {
        $staged = $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PUBLISHED, 250);

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

    public function test_public_index_returns_only_published_hotel(): void
    {
        $this->publishedHotel();
        $this->stagedHotel(100, 'Pending Hotel', OsTravelHotel::PENDING, null);
        $this->stagedHotel(200, 'Orphan Hotel', OsTravelHotel::ORPHANED, null);

        $response = $this->getJson('/api/hotels')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertSame('cap-bon-kelibia-beach-hotel-spa', $response->json('0.slug'));
        $this->assertSame(300, $response->json('0.price'));
        $this->assertSame(250, $response->json('0.base_price'));
        $this->assertSame('20.00', $response->json('0.markup_percentage'));
        $this->assertSame('TND', $response->json('0.currency'));
        $this->assertNotContains('Pending Hotel', array_column($response->json(), 'name'));
        $this->assertNotContains('Orphan Hotel', array_column($response->json(), 'name'));
    }

    public function test_public_show_returns_published_and_404_for_pending_or_orphaned(): void
    {
        $this->publishedHotel();
        $this->stagedHotel(100, 'Pending Hotel', OsTravelHotel::PENDING, null);
        $this->stagedHotel(200, 'Orphan Hotel', OsTravelHotel::ORPHANED, null);

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')
            ->assertOk()
            ->assertJsonPath('base_price', 250)
            ->assertJsonPath('price', 300)
            ->assertJsonPath('markup_percentage', '20.00')
            ->assertJsonPath('currency', 'TND');

        $this->getJson('/api/hotels/pending-hotel')->assertNotFound();
        $this->getJson('/api/hotels/orphan-hotel')->assertNotFound();
    }

    public function test_admin_index_still_lists_pending_published_and_orphaned(): void
    {
        $this->publishedHotel();
        $this->stagedHotel(100, 'Pending Hotel', OsTravelHotel::PENDING, null);
        $this->stagedHotel(200, 'Orphan Hotel', OsTravelHotel::ORPHANED, null);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels')
            ->assertOk();

        $this->assertCount(3, $response->json('data'));

        $statuses = collect($response->json('data'))->map(fn ($row) => $row['status'])->sort()->values()->all();
        $this->assertSame([OsTravelHotel::ORPHANED, OsTravelHotel::PENDING, OsTravelHotel::PUBLISHED], $statuses);

        $published = collect($response->json('data'))->firstWhere('status', OsTravelHotel::PUBLISHED);
        $this->assertSame('178', $published['external_id']);
        $this->assertSame('cap-bon-kelibia-beach-hotel-spa', $published['hotel_slug']);
        $this->assertSame(250, $published['base_price']);
        $this->assertNotNull($published['hotel_id']);
    }

    public function test_public_payload_exposes_no_provider_credentials(): void
    {
        $this->publishedHotel();

        $index = $this->getJson('/api/hotels')->assertOk();
        $this->assertStringNotContainsString('Token', $index->content());
        $this->assertStringNotContainsString('XMLBEL', $index->content());
        $this->assertStringNotContainsString('mygo.co', $index->content());

        $show = $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertOk();
        $this->assertStringNotContainsString('Token', $show->content());
        $this->assertStringNotContainsString('XMLBEL', $show->content());
        $this->assertStringNotContainsString('mygo.co', $show->content());
    }
}
