<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\OsTravelReference;
use App\Models\OsTravelSync;
use App\Models\User;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class AdminOsTravelTest extends TestCase
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
    }

    private function stagedHotel(int $id, string $name, string $status = OsTravelHotel::PENDING, ?int $basePrice = null, ?string $image = 'https://admin.mygo.co/file_manager/source/photos/test.jpg', ?string $cityExternalId = '12', ?string $cityName = 'Kelibia'): OsTravelHotel
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
            'city_external_id' => $cityExternalId,
            'city_name' => $cityName,
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => $image,
            'status' => $status,
            'base_price' => $basePrice,
            'last_synced_at' => now(),
        ]);
    }

    public function test_endpoints_require_authenticated_admin(): void
    {
        $client = User::factory()->create(['role' => 'client', 'active' => true]);

        $this->getJson('/api/admin/os-travel')->assertStatus(401);
        $this->getJson('/api/admin/os-travel/hotels')->assertStatus(401);

        $this->actingAs($client)
            ->getJson('/api/admin/os-travel')
            ->assertForbidden();
        $this->actingAs($client)
            ->postJson('/api/admin/os-travel/hotels/1/approve')
            ->assertForbidden();
    }

    public function test_dashboard_returns_last_sync_and_counts(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, null);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PUBLISHED, 200);
        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::REJECTED, 300);

        $sync = OsTravelSync::create([
            'batch' => 'batch-1',
            'status' => OsTravelSync::SUCCESS,
            'started_at' => now()->subHour(),
            'finished_at' => now(),
            'hotels_count' => 3,
            'details_count' => 3,
            'reactivated_count' => 1,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel')
            ->assertOk();

        $this->assertSame('success', $response->json('data.last_sync.status'));
        $this->assertSame(1, $response->json('data.last_sync.reactivated_count'));
        $this->assertSame(1, $response->json('data.counts.pending'));
        $this->assertSame(1, $response->json('data.counts.published'));
        $this->assertSame(1, $response->json('data.counts.rejected'));
    }

    public function test_index_filters_by_status_and_city(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, null);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::APPROVED, 200);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?status=pending')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Hotel One', $response->json('data.0.name'));
        $this->assertFalse($response->json('data.0.has_base_price'));

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?status=approved')
            ->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Hotel Two', $response->json('data.0.name'));
        $this->assertTrue($response->json('data.0.has_base_price'));

        $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?status=bogus')
            ->assertStatus(422);
    }

    public function test_preview_returns_payload_and_mapped_preview(): void
    {
        $staged = $this->stagedHotel(12, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/os-travel/hotels/{$staged->id}")
            ->assertOk();

        $this->assertArrayHasKey('payload', $response->json('data'));
        $this->assertSame('ostravel-12', $response->json('data.mapped_preview.code'));
        $this->assertSame('Cap Bon Kelibia Beach Hotel & Spa', $response->json('data.mapped_preview.name'));
        $this->assertSame(250, $response->json('data.mapped_preview.base_price'));
        $this->assertSame(300, $response->json('data.mapped_preview.price'));
        $this->assertSame('TND', $response->json('data.mapped_preview.currency'));
        $this->assertGreaterThanOrEqual(1, count($response->json('data.mapped_preview.gallery')));
        // No catalog captured yet: preview falls back to empty defaults.
        $this->assertSame([], $response->json('data.mapped_preview.rooms_catalog'));
        $this->assertNull($response->json('data.mapped_preview.promotion'));
        $this->assertSame([], $response->json('data.mapped_preview.free_child'));
        $this->assertFalse($response->json('data.mapped_preview.recommended'));
    }

    public function test_preview_surfaces_catalog_metadata_from_staging_payload(): void
    {
        $staged = $this->stagedHotel(12, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);

        $staged->update([
            'payload' => array_merge($staged->payload, [
                'catalog' => [
                    'boardings' => [
                        ['id' => 1, 'code' => 'BB', 'name' => 'Bed & Breakfast'],
                        ['id' => 2, 'code' => 'HB', 'name' => 'Half Board'],
                    ],
                    'rooms' => [
                        [
                            'name' => 'Double Standard',
                            'photo' => '/api/hotels/images/abc123',
                            'description' => 'A cosy double room',
                            'features' => ['Sea view', 'Balcony'],
                            'min_stay' => 2,
                            'boarding_id' => 1,
                        ],
                    ],
                    'promotion' => [
                        'title' => 'Early booking',
                        'description' => 'Book early and save',
                        'rate' => '-15%',
                    ],
                    'free_child' => [0, 2],
                    'recommended' => true,
                ],
            ]),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/os-travel/hotels/{$staged->id}")
            ->assertOk();

        $preview = $response->json('data.mapped_preview');
        $this->assertSame('Double Standard', $preview['rooms_catalog'][0]['name']);
        $this->assertSame('/api/hotels/images/abc123', $preview['rooms_catalog'][0]['photo']);
        $this->assertSame(2, $preview['rooms_catalog'][0]['min_stay']);
        $this->assertSame(1, $preview['rooms_catalog'][0]['boarding_id']);
        $this->assertSame('Bed & Breakfast', $preview['boardings'][0]['name']);
        $this->assertSame('-15%', $preview['promotion']['rate']);
        $this->assertSame('Early booking', $preview['promotion']['title']);
        $this->assertSame([0, 2], $preview['free_child']);
        $this->assertTrue($preview['recommended']);
    }

    public function test_update_persists_price_without_publishing(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, null);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/os-travel/hotels/{$staged->id}", [
                'base_price' => 250,
                'markup_percentage' => 15,
                'currency' => 'EUR',
            ])
            ->assertOk();

        $this->assertTrue($response->json('data.has_base_price'));
        $this->assertSame(250, $response->json('data.base_price'));

        $staged->refresh();
        $this->assertSame(250, $staged->base_price);
        $this->assertSame('15.00', (string) $staged->markup_percentage);
        $this->assertSame('EUR', $staged->currency);
        $this->assertSame(OsTravelHotel::PENDING, $staged->status);
        $this->assertSame(0, Hotel::count());
    }

    public function test_update_with_empty_body_is_rejected(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, null);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/os-travel/hotels/{$staged->id}", [])
            ->assertStatus(422);
    }

    public function test_approve_single_publishes_staged_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);

        Cache::put('hotels.index', 'stale', 60);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $staged->refresh();
        $this->assertSame(OsTravelHotel::PUBLISHED, $staged->status);
        $this->assertNotNull($staged->approved_at);
        $this->assertSame($this->admin->id, $staged->approved_by);

        $this->assertSame(1, Hotel::count());
        $hotel = Hotel::first();
        $this->assertSame('ostravel-178', $hotel->code);
        $this->assertSame(250, $hotel->base_price);
        $this->assertSame(300, $hotel->price);
        $this->assertEquals(250.0, $hotel->last_price);
        $this->assertNotNull($hotel->last_price_at);
        $this->assertSame('20.00', (string) $hotel->markup_percentage);
        $this->assertSame('TND', $hotel->currency);
        $this->assertFalse(Cache::has('hotels.index'));
        $this->assertSame((string) $hotel->id, $response->json('data.hotel.id'));
        $this->assertSame(300, $response->json('data.hotel.price'));
    }

    public function test_approve_single_without_price_returns_422_and_publishes_nothing(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, null);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertStatus(422)
            ->assertJsonPath('errors.base_price.0', 'A base price is required before publishing.');

        $this->assertSame(OsTravelHotel::PENDING, $staged->fresh()->status);
        $this->assertSame(0, Hotel::count());
    }

    public function test_approve_single_with_override_markup_uses_math(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, 200);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve", [
                'markup_percentage' => 15,
                'currency' => 'EUR',
            ])
            ->assertOk();

        $hotel = Hotel::first();
        $this->assertSame(230, $hotel->price);
        $this->assertSame('15.00', (string) $hotel->markup_percentage);
        $this->assertSame('EUR', $hotel->currency);
    }

    public function test_approve_with_price_in_body_persists_and_publishes(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, null);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve", [
                'base_price' => 120,
            ])
            ->assertOk();

        $this->assertSame(120, $staged->fresh()->base_price);
        $this->assertSame(144, Hotel::first()->price);
    }

    public function test_bulk_approve_publishes_only_hotels_with_price_and_reports_skips(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, null);
        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::PENDING, 200);
        $this->stagedHotel(4, 'Hotel Four', OsTravelHotel::PUBLISHED, 300);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(2, $response->json('data.published_count'));
        $this->assertSame(['2'], $response->json('data.skipped_no_price'));
        $this->assertSame([], $response->json('data.skipped_over_cap'));

        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '4')->first()->status);
        $this->assertSame(2, Hotel::count());
    }

    public function test_bulk_approve_respects_cap_and_reports_over_cap(): void
    {
        Config::set('ostravel.sync.bulk_approve_max', 2);

        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::PENDING, 100);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(2, $response->json('data.published_count'));
        $this->assertSame(['3'], $response->json('data.skipped_over_cap'));
        $this->assertSame(2, Hotel::count());
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '3')->first()->status);
    }

    public function test_bulk_approve_skips_hotels_without_image_unless_opt_in(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, 100, null);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(1, $response->json('data.published_count'));
        $this->assertSame(['2'], $response->json('data.skipped_no_image'));
        $this->assertSame([], $response->json('data.skipped_no_price'));
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(1, Hotel::count());

        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::PENDING, 200, null);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'include_without_image' => true,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.published_count'));
        $this->assertSame([], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(3, Hotel::count());
    }

    public function test_bulk_approve_without_price_flag_attempts_no_price_hotels(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, null);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'include_without_price' => true,
            ])
            ->assertOk();

        $this->assertSame(1, $response->json('data.published_count'));
        $this->assertSame(1, $response->json('data.failed_count'));
        $this->assertSame(['2'], $response->json('data.failed'));
        $this->assertSame([], $response->json('data.skipped_no_price'));
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(1, Hotel::count());
    }

    public function test_bulk_approve_flags_placeholder_image_as_missing_image(): void
    {
        $this->stagedHotel(1, 'Real Image', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Placeholder Image', OsTravelHotel::PENDING, 100, 'https://via.placeholder.com/1170x654.png?text=Hotel');
        $this->stagedHotel(3, 'Placeholder Two', OsTravelHotel::PENDING, 100, 'https://placehold.co/600x400');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(1, $response->json('data.published_count'));
        $this->assertSame(['2', '3'], $response->json('data.skipped_no_image'));
        $this->assertSame([], $response->json('data.skipped_no_price'));
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(1, Hotel::count());

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'include_without_image' => true,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.published_count'));
        $this->assertSame([], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(3, Hotel::count());
    }

    public function test_bulk_approve_only_targets_hotels_matching_applied_filters(): void
    {
        $this->stagedHotel(1, 'Kelibia One', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Djerba Two', OsTravelHotel::PENDING, 100, 'https://admin.mygo.co/file_manager/source/photos/test.jpg', '345', 'Djerba');
        $this->stagedHotel(3, 'Djerba Three', OsTravelHotel::PENDING, 100, 'https://admin.mygo.co/file_manager/source/photos/test.jpg', '345', 'Djerba');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'city_id' => '345',
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.published_count'));
        $this->assertSame([], $response->json('data.skipped_no_price'));
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::PUBLISHED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(2, Hotel::count());
    }

    public function test_reject_sets_status_without_creating_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, null);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/reject")
            ->assertOk();

        $this->assertSame(OsTravelHotel::REJECTED, $staged->fresh()->status);
        $this->assertNotNull($staged->fresh()->rejected_at);
        $this->assertSame(0, Hotel::count());
    }

    public function test_unapprove_moves_approved_hotel_back_to_pending(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::APPROVED, 250);
        $staged->update([
            'approved_by' => $this->admin->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/unapprove")
            ->assertOk();

        $fresh = $staged->fresh();
        $this->assertSame(OsTravelHotel::PENDING, $fresh->status);
        $this->assertNull($fresh->approved_at);
        $this->assertNull($fresh->approved_by);
    }

    public function test_unapprove_deletes_published_hotel_and_returns_to_pending(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, 250);

        $published = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $hotelId = $published->json('data.hotel.id');
        $this->assertSame(1, Hotel::count());

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/unapprove")
            ->assertOk();

        $fresh = $staged->fresh();
        $this->assertSame(OsTravelHotel::PENDING, $fresh->status);
        $this->assertNull($fresh->hotel_id);
        $this->assertSame(0, Hotel::count());
        $this->assertNull(Hotel::query()->where('id', $hotelId)->first());
    }

    public function test_unapprove_rejects_pending_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING, null);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/unapprove")
            ->assertStatus(422);
    }

    public function test_refresh_single_price_persists_provider_price_as_base_price(): void
    {
        $staged = $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, null);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/refresh-price")
            ->assertOk();

        $this->assertTrue($response->json('data.has_base_price'));
        $this->assertSame(928, $response->json('data.base_price'));
        $this->assertSame('TND', $response->json('data.currency'));
        $this->assertSame(1, $response->json('data.refresh.updated'));
        $this->assertSame(0, $response->json('data.refresh.omitted'));

        $staged->refresh();
        $this->assertSame(928, $staged->base_price);
        $this->assertSame('TND', $staged->currency);
        $this->assertSame(OsTravelHotel::PENDING, $staged->status);
        $this->assertSame(0, Hotel::count());
    }

    public function test_refresh_single_price_writes_nothing_when_hotel_unavailable(): void
    {
        $staged = $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING, null);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/refresh-price")
            ->assertOk();

        $this->assertFalse($response->json('data.has_base_price'));
        $this->assertNull($response->json('data.base_price'));
        $this->assertSame(0, $response->json('data.refresh.updated'));
        // Stop Sales Hotel is returned but has no bookable room, so it has no
        // live price and counts as omitted.
        $this->assertSame(1, $response->json('data.refresh.omitted'));
        $this->assertNull($staged->fresh()->base_price);
    }

    public function test_refresh_all_prices_updates_staged_hotels_only(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, null);
        $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::APPROVED, null);
        $this->stagedHotel(200, 'Published Hotel', OsTravelHotel::PUBLISHED, 300);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/refresh-prices')
            ->assertOk();

        // The bulk refresh runs synchronously in the request.
        $this->assertSame(1, $response->json('data.updated'));
        // Stop Sales Hotel is returned but has no bookable room, so it has no
        // live price and counts as omitted.
        $this->assertSame(1, $response->json('data.omitted'));
        $this->assertSame(['999'], $response->json('data.omitted_ids'));
        $this->assertSame([], $response->json('data.failed_ids'));

        $this->assertSame(928, OsTravelHotel::where('external_id', '178')->first()->base_price);
        $this->assertNull(OsTravelHotel::where('external_id', '999')->first()->base_price);
        $this->assertSame(300, OsTravelHotel::where('external_id', '200')->first()->base_price);
    }

    public function test_refresh_prices_accepts_targeted_ids(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, null);
        $other = $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING, null);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/refresh-prices', [
                'ids' => [(string) $other->id],
            ])
            ->assertOk();

        // Only the targeted (stop-sales) hotel was queried, which yields no price.
        $this->assertSame(0, $response->json('data.updated'));
        $this->assertSame(1, $response->json('data.omitted'));
        $this->assertNull(OsTravelHotel::where('external_id', '178')->first()->base_price);
        $this->assertNull(OsTravelHotel::where('external_id', '999')->first()->base_price);
    }

    public function test_refresh_prices_marks_unavailable_hotels_with_reason(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, null);
        $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING, null);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/refresh-prices')
            ->assertOk();

        $available = OsTravelHotel::where('external_id', '178')->first();
        $this->assertSame(928, $available->base_price);
        $this->assertSame(OsTravelHotel::AVAILABILITY_AVAILABLE, $available->availability_status);

        $stopSales = OsTravelHotel::where('external_id', '999')->first();
        $this->assertNull($stopSales->base_price);
        $this->assertSame(OsTravelHotel::AVAILABILITY_STOP_RESERVATION, $stopSales->availability_status);
    }

    public function test_refresh_prices_validates_ids_and_dates(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/refresh-prices', ['ids' => ['abc']])
            ->assertStatus(422);

        $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/refresh-prices', [
                'check_in' => '2026-09-01',
                'check_out' => '2026-08-01',
            ])
            ->assertStatus(422);
    }

    public function test_reject_published_hotel_is_forbidden(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PUBLISHED, 100);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/reject")
            ->assertStatus(422);

        $this->assertSame(OsTravelHotel::PUBLISHED, $staged->fresh()->status);
    }

    public function test_reapprove_is_idempotent_and_returns_existing_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $hotelId = Hotel::first()->id;
        $approvedAt = $staged->fresh()->approved_at;

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $this->assertSame(1, Hotel::count());
        $this->assertSame((string) $hotelId, $response->json('data.hotel.id'));
        $this->assertTrue($staged->fresh()->approved_at->equalTo($approvedAt));
        $this->assertSame(OsTravelHotel::PUBLISHED, $staged->fresh()->status);
    }

    public function test_bulk_approve_continues_when_single_publish_fails(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING, 100);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, 100);

        $publisher = $this->createMock(HotelPublisher::class);
        $publisher->expects($this->exactly(2))
            ->method('publish')
            ->willReturnCallback(function (OsTravelHotel $hotel) {
                if ($hotel->external_id === '2') {
                    throw new InvalidArgumentException('boom');
                }

                return Hotel::create([
                    'slug' => 'ostravel-1',
                    'code' => 'ostravel-1',
                    'name' => ['en' => 'Hotel One'],
                    'location' => ['en' => 'Kelibia'],
                    'category' => ['en' => '4 étoiles'],
                    'price' => 120,
                    'base_price' => 100,
                    'markup_percentage' => 20,
                    'currency' => 'TND',
                    'image' => 'test.jpg',
                    'tags' => [],
                    'details' => [],
                    'meta' => [],
                ]);
            });
        $this->app->instance(HotelPublisher::class, $publisher);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(1, $response->json('data.published_count'));
        $this->assertSame(1, $response->json('data.failed_count'));
        $this->assertSame([(string) OsTravelHotel::where('external_id', '2')->first()->id], $response->json('data.failed'));
    }

    public function test_index_filters_by_country_and_city(): void
    {
        $this->stagedHotel(178, 'Kelibia Hotel', OsTravelHotel::PENDING, 250);
        $this->stagedHotel(999, 'Djerba Hotel', OsTravelHotel::PENDING, 300);
        OsTravelHotel::where('external_id', '999')->update([
            'city_external_id' => '18',
            'city_name' => 'Djerba',
            'country_external_id' => '999',
            'country_name' => 'Turquie',
        ]);
        OsTravelHotel::where('external_id', '178')->update([
            'country_external_id' => '219',
            'country_name' => 'Tunisie',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?country_id=219')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Kelibia Hotel', $response->json('data.0.name'));
        $this->assertSame('Tunisie', $response->json('data.0.country_name'));
        $this->assertSame('219', $response->json('data.0.country_external_id'));

        $cityResponse = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?city_id=18')
            ->assertOk();

        $this->assertCount(1, $cityResponse->json('data'));
        $this->assertSame('Djerba Hotel', $cityResponse->json('data.0.name'));
    }

    public function test_index_filters_by_stars(): void
    {
        $this->stagedHotel(178, 'Kelibia Hotel', OsTravelHotel::PENDING, 250);
        $this->stagedHotel(999, 'Djerba Hotel', OsTravelHotel::PENDING, 300);
        OsTravelHotel::where('external_id', '999')->update(['stars' => 2]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?stars=3')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Kelibia Hotel', $response->json('data.0.name'));
    }

    public function test_index_runs_live_probe_and_merges_status_per_row(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);
        $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING, null);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?check_in=2026-09-01&check_out=2026-09-08')
            ->assertOk();

        $rows = collect($response->json('data'))->keyBy('name');
        $this->assertSame('available', $rows['Cap Bon Kelibia Beach Hotel & Spa']['live_status']);
        $this->assertSame(927.52, $rows['Cap Bon Kelibia Beach Hotel & Spa']['live_price']);
        $this->assertSame('TND', $rows['Cap Bon Kelibia Beach Hotel & Spa']['live_currency']);
        // Final price = live API price + markup (default 20%).
        $this->assertSame(1113, $rows['Cap Bon Kelibia Beach Hotel & Spa']['final_price']);
        // The stop-reserved hotel is flagged as unavailable with its reason.
        $this->assertSame('stop_reservation', $rows['Stop Sales Hotel']['live_status']);
        $this->assertNull($rows['Stop Sales Hotel']['live_price']);
        $this->assertNull($rows['Stop Sales Hotel']['final_price']);
        $this->assertNull($rows['Stop Sales Hotel']['live_until']);
    }

    public function test_index_returns_projected_final_price_from_scheduled_min(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);
        $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING, null);
        OsTravelHotel::where('external_id', '999')->update(['markup_percentage' => 15]);

        // No date filter -> no live probe: final price is the projected sell
        // price from the scheduled min (base_price + markup).
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels')
            ->assertOk();

        $rows = collect($response->json('data'))->keyBy('name');
        $this->assertNull($rows['Cap Bon Kelibia Beach Hotel & Spa']['live_status']);
        // base 250 + default markup 20% = 300.
        $this->assertSame(300, $rows['Cap Bon Kelibia Beach Hotel & Spa']['final_price']);
        // base null -> no projected final price even with a stored markup.
        $this->assertNull($rows['Stop Sales Hotel']['final_price']);
    }

    public function test_references_returns_countries_and_cities_with_country_id(): void
    {
        OsTravelReference::create([
            'type' => OsTravelReference::TYPE_COUNTRY,
            'external_id' => '219',
            'name' => 'Tunisie',
            'payload' => [],
        ]);
        OsTravelReference::create([
            'type' => OsTravelReference::TYPE_CITY,
            'external_id' => '12',
            'name' => 'Kelibia',
            'payload' => ['Id' => 12, 'Name' => 'Kelibia', 'Country' => ['Id' => 219, 'Name' => 'Tunisie']],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/references')
            ->assertOk();

        $this->assertCount(1, $response->json('data.countries'));
        $this->assertSame('219', $response->json('data.countries.0.id'));
        $this->assertSame('Tunisie', $response->json('data.countries.0.name'));
        $this->assertSame('12', $response->json('data.cities.0.id'));
        $this->assertSame('219', $response->json('data.cities.0.country_id'));
    }

    public function test_refresh_prices_reports_failed_provider_errors_per_hotel(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING, 250);
        $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING, null);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response('', 500),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/refresh-prices')
            ->assertOk();

        $this->assertSame(0, $response->json('data.updated'));
        $this->assertSame(0, $response->json('data.omitted'));
        $failed = $response->json('data.failed_ids');
        $this->assertContains('178', $failed);
        $this->assertContains('999', $failed);
        $this->assertSame(OsTravelHotel::PRICE_PROVIDER_ERROR, OsTravelHotel::where('external_id', '178')->first()->price_status);
    }
}
