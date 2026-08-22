<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\OsTravelReference;
use App\Models\OsTravelSync;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    private function stagedHotel(int $id, string $name, string $status = OsTravelHotel::PENDING, ?string $image = 'https://admin.mygo.co/file_manager/source/photos/test.jpg', ?string $cityExternalId = '12', ?string $cityName = 'Kelibia'): OsTravelHotel
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
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::APPROVED);
        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::REJECTED);

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
        $this->assertSame(1, $response->json('data.counts.approved'));
        $this->assertSame(1, $response->json('data.counts.rejected'));
    }

    public function test_index_filters_by_status_and_city(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::APPROVED);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?status=pending')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Hotel One', $response->json('data.0.name'));
        $this->assertNull($response->json('data.0.base_price'));
        $this->assertArrayNotHasKey('has_base_price', $response->json('data.0'));

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?status=approved')
            ->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Hotel Two', $response->json('data.0.name'));
        $this->assertNull($response->json('data.0.base_price'));

        $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?status=bogus')
            ->assertStatus(422);
    }

    public function test_preview_returns_payload_and_mapped_preview(): void
    {
        $staged = $this->stagedHotel(12, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/os-travel/hotels/{$staged->id}")
            ->assertOk();

        $this->assertArrayHasKey('payload', $response->json('data'));
        $this->assertSame('ostravel-12', $response->json('data.mapped_preview.code'));
        $this->assertSame('Cap Bon Kelibia Beach Hotel & Spa', $response->json('data.mapped_preview.name'));
        $this->assertSame(20, $response->json('data.mapped_preview.markup_percentage'));
        $this->assertSame('TND', $response->json('data.mapped_preview.currency'));
        $this->assertGreaterThanOrEqual(1, count($response->json('data.mapped_preview.gallery')));
        $this->assertContains('Demi Pension', $response->json('data.mapped_preview.boarding'));
        // Price/availability catalog fields no longer exist on the preview.
        $this->assertArrayNotHasKey('rooms_catalog', $response->json('data.mapped_preview'));
        $this->assertArrayNotHasKey('promotion', $response->json('data.mapped_preview'));
        $this->assertArrayNotHasKey('free_child', $response->json('data.mapped_preview'));
        $this->assertArrayNotHasKey('recommended', $response->json('data.mapped_preview'));
        $this->assertArrayNotHasKey('base_price', $response->json('data.mapped_preview'));
        $this->assertArrayNotHasKey('price', $response->json('data.mapped_preview'));
    }

    public function test_preview_surfaces_boarding_from_hotel_detail(): void
    {
        $staged = $this->stagedHotel(12, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING);

        $staged->update([
            'payload' => array_merge($staged->payload, [
                'HotelDetail' => array_merge($staged->payload['HotelDetail'], [
                    'Boarding' => [
                        ['Id' => 1, 'Code' => 'BB', 'Name' => 'Bed & Breakfast'],
                        ['Id' => 2, 'Code' => 'HB', 'Name' => 'Half Board'],
                    ],
                ]),
            ]),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/os-travel/hotels/{$staged->id}")
            ->assertOk();

        $preview = $response->json('data.mapped_preview');
        $this->assertSame(['Bed & Breakfast', 'Half Board'], $preview['boarding']);
    }

    public function test_update_persists_markup_and_currency_without_publishing(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/os-travel/hotels/{$staged->id}", [
                'markup_percentage' => 15,
                'currency' => 'EUR',
            ])
            ->assertOk();

        $this->assertSame('15.00', $response->json('data.markup_percentage'));
        $this->assertSame('EUR', $response->json('data.currency'));
        $this->assertNull($response->json('data.base_price'));

        $staged->refresh();
        $this->assertSame('15.00', (string) $staged->markup_percentage);
        $this->assertSame('EUR', $staged->currency);
        $this->assertSame(OsTravelHotel::PENDING, $staged->status);
        $this->assertSame(0, Hotel::count());
    }

    public function test_update_with_empty_body_is_rejected(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/os-travel/hotels/{$staged->id}", [])
            ->assertStatus(422);
    }

    public function test_approve_single_publishes_staged_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING);

        Cache::put('hotels.index', 'stale', 60);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $staged->refresh();
        $this->assertSame(OsTravelHotel::APPROVED, $staged->status);
        $this->assertNotNull($staged->approved_at);
        $this->assertSame($this->admin->id, $staged->approved_by);

        $this->assertSame(1, Hotel::count());
        $hotel = Hotel::first();
        $this->assertSame('ostravel-178', $hotel->code);
        $this->assertSame('20.00', (string) $hotel->markup_percentage);
        $this->assertSame('TND', $hotel->currency);
        $this->assertFalse(Cache::has('hotels.index'));
        $this->assertSame((string) $hotel->id, $response->json('data.hotel.id'));
        $this->assertSame('20.00', $response->json('data.hotel.markup_percentage'));
        $this->assertSame('TND', $response->json('data.hotel.currency'));
    }

    public function test_approve_without_price_publishes_successfully(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $this->assertSame(OsTravelHotel::APPROVED, $staged->fresh()->status);
        $this->assertSame(1, Hotel::count());
        $this->assertNotNull(OsTravelHotel::find($staged->id)->hotel_id);
    }

    public function test_approve_single_with_override_markup_and_currency_persists(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve", [
                'markup_percentage' => 15,
                'currency' => 'EUR',
            ])
            ->assertOk();

        $hotel = Hotel::first();
        $this->assertSame('15.00', (string) $hotel->markup_percentage);
        $this->assertSame('EUR', $hotel->currency);
        $staged->refresh();
        $this->assertSame('15.00', (string) $staged->markup_percentage);
        $this->assertSame('EUR', $staged->currency);
    }

    public function test_approve_with_markup_and_currency_in_body_persists_and_publishes(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve", [
                'markup_percentage' => 15,
                'currency' => 'EUR',
            ])
            ->assertOk();

        $this->assertSame('15.00', $response->json('data.markup_percentage'));
        $this->assertSame('EUR', $response->json('data.currency'));
        $this->assertNull($response->json('data.base_price'));

        $this->assertSame('15.00', (string) $staged->fresh()->markup_percentage);
        $this->assertSame('EUR', $staged->fresh()->currency);
        $published = Hotel::first();
        $this->assertSame('15.00', (string) $published->markup_percentage);
        $this->assertSame('EUR', $published->currency);
    }

    public function test_bulk_approve_publishes_hotels_matching_filters(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING);
        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::PENDING);
        $this->stagedHotel(4, 'Hotel Four', OsTravelHotel::APPROVED);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(3, $response->json('data.approved_count'));
        $this->assertSame(0, $response->json('data.failed_count'));
        $this->assertSame([], $response->json('data.skipped_no_image'));

        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '4')->first()->status);
        $this->assertSame(3, Hotel::count());
        $this->assertNotNull(OsTravelHotel::where('external_id', '1')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '3')->first()->hotel_id);
        $this->assertNull(OsTravelHotel::where('external_id', '4')->first()->hotel_id);
    }

    public function test_bulk_approve_confirms_live_pending_rows_without_republishing(): void
    {
        $staged = $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);
        $hotel = Hotel::create([
            'slug' => 'ostravel-1',
            'code' => 'ostravel-1',
            'name' => ['en' => 'Hotel One', 'fr' => 'Hotel One', 'ar' => 'Hotel One'],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'image' => 'test.jpg',
            'tags' => [],
            'details' => [],
            'meta' => [],
        ]);
        $staged->update(['hotel_id' => $hotel->id]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        // The row was already on the public site: bulk approve confirms it
        // instead of leaving it stuck in the pending queue.
        $this->assertSame(1, $response->json('data.approved_count'));
        $this->assertSame(0, $response->json('data.failed_count'));
        $this->assertSame(1, Hotel::count());
        $fresh = $staged->fresh();
        $this->assertSame(OsTravelHotel::APPROVED, $fresh->status);
        $this->assertSame($hotel->id, $fresh->hotel_id);
        $this->assertNotNull($fresh->approved_at);
    }

    public function test_bulk_approve_skips_hotels_without_image_unless_opt_in(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, null);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(1, $response->json('data.approved_count'));
        $this->assertSame(['2'], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(1, Hotel::count());
        $this->assertNotNull(OsTravelHotel::where('external_id', '1')->first()->hotel_id);
        $this->assertNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);

        $this->stagedHotel(3, 'Hotel Three', OsTravelHotel::PENDING, null);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'include_without_image' => true,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.approved_count'));
        $this->assertSame([], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(3, Hotel::count());
        $this->assertNotNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '3')->first()->hotel_id);
    }

    public function test_bulk_approve_with_include_without_image_flag_publishes_hotels_without_image(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Hotel Two', OsTravelHotel::PENDING, null);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'include_without_image' => true,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.approved_count'));
        $this->assertSame(0, $response->json('data.failed_count'));
        $this->assertSame([], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(2, Hotel::count());
        $this->assertNotNull(OsTravelHotel::where('external_id', '1')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);
    }

    public function test_bulk_approve_flags_placeholder_image_as_missing_image(): void
    {
        $this->stagedHotel(1, 'Real Image', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Placeholder Image', OsTravelHotel::PENDING, 'https://via.placeholder.com/1170x654.png?text=Hotel');
        $this->stagedHotel(3, 'Placeholder Two', OsTravelHotel::PENDING, 'https://placehold.co/600x400');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $this->assertSame(1, $response->json('data.approved_count'));
        $this->assertSame(['2', '3'], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(1, Hotel::count());
        $this->assertNotNull(OsTravelHotel::where('external_id', '1')->first()->hotel_id);
        $this->assertNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);
        $this->assertNull(OsTravelHotel::where('external_id', '3')->first()->hotel_id);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'include_without_image' => true,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.approved_count'));
        $this->assertSame([], $response->json('data.skipped_no_image'));
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(3, Hotel::count());
        $this->assertNotNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '3')->first()->hotel_id);
    }

    public function test_bulk_approve_only_targets_hotels_matching_applied_filters(): void
    {
        $this->stagedHotel(1, 'Kelibia One', OsTravelHotel::PENDING);
        $this->stagedHotel(2, 'Djerba Two', OsTravelHotel::PENDING, 'https://admin.mygo.co/file_manager/source/photos/test.jpg', '345', 'Djerba');
        $this->stagedHotel(3, 'Djerba Three', OsTravelHotel::PENDING, 'https://admin.mygo.co/file_manager/source/photos/test.jpg', '345', 'Djerba');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'city_id' => '345',
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.approved_count'));
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::where('external_id', '1')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '2')->first()->status);
        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::where('external_id', '3')->first()->status);
        $this->assertSame(2, Hotel::count());
        $this->assertNull(OsTravelHotel::where('external_id', '1')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '2')->first()->hotel_id);
        $this->assertNotNull(OsTravelHotel::where('external_id', '3')->first()->hotel_id);
    }

    public function test_reject_sets_status_without_creating_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/reject")
            ->assertOk();

        $this->assertSame(OsTravelHotel::REJECTED, $staged->fresh()->status);
        $this->assertNotNull($staged->fresh()->rejected_at);
        $this->assertSame(0, Hotel::count());
    }

    public function test_approve_undoes_reject_and_publishes_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::REJECTED);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $this->assertSame(1, Hotel::count());
        $published = Hotel::first();
        $this->assertStringStartsWith('ostravel-', (string) $published->code);
        $fresh = $staged->fresh();
        $this->assertSame(OsTravelHotel::APPROVED, $fresh->status);
        $this->assertNotNull($fresh->hotel_id);
        $this->assertNotNull($response->json('data.hotel.id'));
    }

    public function test_reopen_moves_rejected_hotel_back_to_pending(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::REJECTED);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/reopen")
            ->assertOk();

        $fresh = $staged->fresh();
        $this->assertSame(OsTravelHotel::PENDING, $fresh->status);
        $this->assertNull($fresh->rejected_at);
        $this->assertSame(0, Hotel::count());
    }

    public function test_reopen_non_rejected_hotel_is_forbidden(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/reopen")
            ->assertStatus(422);

        $this->assertSame(OsTravelHotel::PENDING, $staged->fresh()->status);
    }

    public function test_unapprove_moves_approved_hotel_back_to_pending(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::APPROVED);
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
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

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
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/unapprove")
            ->assertStatus(422);
    }

    public function test_reject_live_hotel_is_forbidden(): void
    {
        $staged = $this->stagedHotel(178, 'Hotel One', OsTravelHotel::APPROVED);
        $hotel = Hotel::create([
            'slug' => 'ostravel-178',
            'code' => 'ostravel-178',
            'name' => ['en' => 'Hotel One', 'fr' => 'Hotel One', 'ar' => 'Hotel One'],
            'location' => ['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'image' => 'test.jpg',
            'tags' => [],
            'details' => [],
            'meta' => [],
        ]);
        $staged->update(['hotel_id' => $hotel->id]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/reject")
            ->assertStatus(422);

        $this->assertSame(OsTravelHotel::APPROVED, $staged->fresh()->status);
    }

    public function test_reapprove_is_idempotent_and_returns_existing_hotel(): void
    {
        $staged = $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING);

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
        $this->assertSame('20.00', $response->json('data.hotel.markup_percentage'));
        $this->assertSame('TND', $response->json('data.hotel.currency'));
        $this->assertArrayNotHasKey('base_price', $response->json('data.hotel'));
        $this->assertTrue($staged->fresh()->approved_at->equalTo($approvedAt));
        $this->assertSame(OsTravelHotel::APPROVED, $staged->fresh()->status);
    }

    public function test_bulk_approve_persists_batch_wide_markup_and_currency(): void
    {
        $staged = $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all', [
                'markup_percentage' => 15,
                'currency' => 'EUR',
            ])
            ->assertOk();

        $this->assertSame(1, $response->json('data.approved_count'));
        $this->assertSame(0, $response->json('data.failed_count'));

        $hotel = $staged->fresh();
        $this->assertSame(OsTravelHotel::APPROVED, $hotel->status);
        $this->assertSame('15.00', (string) $hotel->markup_percentage);
        $this->assertSame('EUR', $hotel->currency);
        $this->assertNotNull($hotel->approved_at);
        $this->assertSame($this->admin->id, $hotel->approved_by);
        $this->assertSame(1, Hotel::count());
        $this->assertNotNull($hotel->hotel_id);

        $published = Hotel::first();
        $this->assertNotNull($published);
        $this->assertSame('15.00', (string) $published->markup_percentage);
        $this->assertSame('EUR', $published->currency);
    }

    public function test_bulk_approve_publishes_with_local_image(): void
    {
        $this->stagedHotel(1, 'Hotel One', OsTravelHotel::PENDING);

        $this->actingAs($this->admin)
            ->postJson('/api/admin/os-travel/hotels/approve-all')
            ->assertOk();

        $hotel = Hotel::first();
        $this->assertNotNull($hotel);
        $this->assertNotNull(OsTravelHotel::where('external_id', '1')->first()->hotel_id);
        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
    }

    public function test_index_filters_by_country_and_city(): void
    {
        $this->stagedHotel(178, 'Kelibia Hotel', OsTravelHotel::PENDING);
        $this->stagedHotel(999, 'Djerba Hotel', OsTravelHotel::PENDING);
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
        $this->stagedHotel(178, 'Kelibia Hotel', OsTravelHotel::PENDING);
        $this->stagedHotel(999, 'Djerba Hotel', OsTravelHotel::PENDING);
        OsTravelHotel::where('external_id', '999')->update(['stars' => 2]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?stars=3')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Kelibia Hotel', $response->json('data.0.name'));
    }

    public function test_index_runs_live_probe_and_merges_status_per_row(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING);
        $this->stagedHotel(999, 'Stop Sales Hotel', OsTravelHotel::PENDING);

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
        $this->assertNull($rows['Cap Bon Kelibia Beach Hotel & Spa']['live_reason']);
        $this->assertNull($rows['Cap Bon Kelibia Beach Hotel & Spa']['live_until']);
        // The priced hotel exposes the raw provider price and the sell price
        // with the default 20% markup (927.52 × 1.2 = 1113).
        $this->assertSame(927.52, $rows['Cap Bon Kelibia Beach Hotel & Spa']['base_price']);
        $this->assertSame(1113, $rows['Cap Bon Kelibia Beach Hotel & Spa']['final_price']);
        // The stop-reserved hotel is flagged as unavailable with its reason.
        $this->assertSame('stop_reservation', $rows['Stop Sales Hotel']['live_status']);
        $this->assertNull($rows['Stop Sales Hotel']['live_price']);
        $this->assertNull($rows['Stop Sales Hotel']['live_until']);
        $this->assertNull($rows['Stop Sales Hotel']['base_price']);
        $this->assertNull($rows['Stop Sales Hotel']['final_price']);
        $this->assertStringContainsString('stop reservation', $rows['Stop Sales Hotel']['live_reason']);
    }

    public function test_index_reports_min_stay_reason_when_picked_window_is_shorter_than_minimum_stay(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa', OsTravelHotel::PENDING);

        // Single MinStay-3 room so every non-stop-reserved room needs 3 nights.
        $envelope = $this->osTravelFixture('hotel_search');
        $envelope['HotelSearch'] = [$envelope['HotelSearch'][0]];
        $envelope['HotelSearch'][0]['Hotel']['Id'] = 178;
        $boarding = $envelope['HotelSearch'][0]['Price']['Boarding'][0];
        $boarding['Pax'][0]['Rooms'] = [array_merge($boarding['Pax'][0]['Rooms'][0], ['MinStay' => 3])];
        $envelope['HotelSearch'][0]['Price']['Boarding'] = [$boarding];

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($envelope),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/os-travel/hotels?check_in=2026-09-01&check_out=2026-09-02')
            ->assertOk();

        $row = $response->json('data.0');
        $this->assertSame('min_stay', $row['live_status']);
        $this->assertSame('2026-09-01', $row['live_until']);
        $this->assertNull($row['live_price']);
        $this->assertStringContainsString('minimum stay', $row['live_reason']);
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
}
