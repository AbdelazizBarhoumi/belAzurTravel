<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\OsTravelSync;
use App\Models\Payment;
use App\Models\User;
use App\Services\ClictoPayService;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

/**
 * Phase 11 go-live: the full happy path from catalog sync through live
 * search, prebook, pay, confirm, list and cancel — mirroring the manual E2E
 * checklist in docs/os-travel-phase-11-final-qa.md.
 */
class OsTravelGoLiveFlowTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    private User $client;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
        Storage::fake('public');
        Cache::flush();

        $this->client = User::factory()->create(['role' => 'client', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    public function test_full_os_travel_flow_from_sync_to_cancellation(): void
    {
        // 1. run sync -> staged PENDING hotels in staging.
        $this->fakeOsTravelChain();
        $this->assertSame(Command::SUCCESS, Artisan::call('os-travel:sync-catalog'));
        $this->assertSame(OsTravelSync::SUCCESS, OsTravelSync::first()->status);
        $staged = OsTravelHotel::where('external_id', '178')->first();
        $this->assertSame(OsTravelHotel::PENDING, $staged->status);

        // 2. approve -> published hotel exists.
        $this->actingAs($this->admin)
            ->putJson("/api/admin/os-travel/hotels/{$staged->id}", [
                'markup_percentage' => 20,
                'currency' => 'TND',
            ])
            ->assertOk();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $staged->refresh();
        $this->assertSame(OsTravelHotel::APPROVED, $staged->status);
        $hotel = Hotel::first();
        $this->assertSame('cap-bon-kelibia-beach-hotel-spa', $hotel->slug);
        // Published provider hotels carry no stored price.
        $this->assertNull($hotel->base_price);
        $this->assertSame(0, $hotel->price);

        // 3. browse (no dates): provider prices are null; no provider calls.
        Http::fake(['https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search'))]);
        $index = $this->getJson('/api/hotels')->assertOk();
        $browse = collect($index->json())->firstWhere('slug', $hotel->slug);
        $this->assertNull($browse['price']);
        $this->assertNull($browse['base_price']);

        // 4. live search (dates): one batched HotelSearch; live markup prices + tokens.
        $search = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-08',
        ])->assertOk();

        $live = collect($search->json('data'))->firstWhere('slug', $hotel->slug);
        $this->assertSame(1113, $live['price']);
        $this->assertSame(927.52, $live['base_price']);
        $this->assertSame('eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=', $live['rooms'][0]['token']);
        $this->assertSame(501, (int) $live['rooms'][0]['id']);
        $this->assertSame(4, $live['rooms'][0]['boarding_id']);
        // The live HotelSearch response carries View/Supplement; the booking
        // proxy echoes them for the provider.
        $this->assertSame([1, 3], $live['rooms'][0]['view_ids']);
        $this->assertSame('Insurance', $live['rooms'][0]['supplements'][0]['Name']);

        // 5. prebook -> booking created Pending with provider payload.
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::sequence()
                ->push($this->osTravelFixture('booking_creation_prebook'))
                ->push($this->osTravelFixture('booking_creation_confirm')),
        ]);

        $prebooked = $this->actingAs($this->client)
            ->postJson('/api/bookings', [
                'type' => 'hotel',
                'item_slug' => $hotel->slug,
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-05',
                'client' => ['name' => 'John Doe', 'email' => 'john@example.com', 'phone' => '123456789'],
                'amount' => 1113,
                'provider' => [
                    'token' => 'eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=',
                    'source' => 'OS-TRAVEL-DIRECT',
                    'rooms' => [[
                        'id' => 501,
                        'boarding_id' => 4,
                        'view_ids' => [1],
                        'supplements' => [],
                    ]],
                    'pax' => [
                        'adults' => [['Civility' => 'Mr', 'Name' => 'John', 'Surname' => 'Doe', 'Holder' => true]],
                        'children' => [],
                    ],
                ],
            ])
            ->assertCreated()
            ->json();

        $this->assertSame('Pending', $prebooked['status']);
        $this->assertSame(1113, $prebooked['total_amount']);
        $this->assertSame(927.52, $prebooked['provider_prebook']['total']);
        $this->assertNull($prebooked['provider_booking_id']);

        // 6. pay -> callback confirms -> provider id persisted + listed.
        $this->mock(ClictoPayService::class, function ($mock) {
            $mock->shouldReceive('verifyPayment')->once()->andReturn([
                'status' => 'completed',
                'amount' => 1113,
                'orderId' => 'ORDER-1',
                'raw' => [],
            ]);
        });

        Payment::create([
            'booking_id' => $prebooked['id'],
            'user_id' => $this->client->id,
            'amount' => 1113,
            'currency' => 'TND',
            'status' => 'pending',
            'clictopay_order_id' => 'ORDER-1',
        ]);

        $this->actingAs($this->client)
            ->getJson('/api/payment/callback?orderId=ORDER-1&booking_id='.$prebooked['id'])
            ->assertRedirect();

        $booking = $this->actingAs($this->client)
            ->getJson("/api/bookings/{$prebooked['id']}")
            ->assertOk()
            ->json();

        $this->assertSame('Confirmed', $booking['status']);
        $this->assertSame('98765', $booking['provider_booking_id']);
        $this->assertSame('VOUCH-98765', $booking['provider_booking_reference']);

        // Booking is listed for the client.
        $this->actingAs($this->client)
            ->getJson('/api/client/bookings')
            ->assertOk()
            ->assertJsonFragment(['id' => $prebooked['id'], 'status' => 'Confirmed']);

        // 7. cancel preview -> confirm cancel -> cancelled.
        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::sequence()
                ->push($this->osTravelFixture('booking_cancellation_preview'))
                ->push($this->osTravelFixture('booking_cancellation_confirm')),
        ]);

        $cancelled = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$prebooked['id']}/cancel")
            ->assertOk()
            ->json();

        $this->assertSame('Cancelled', $cancelled['status']);
        $this->assertSame('Cancelled', $cancelled['provider_status']);
        $this->assertSame(185.5, $cancelled['cancellation_penalty'][0]['Fees']);
        $this->assertNotNull($cancelled['cancelled_at']);

        // 8. idempotency: cancelling again is a no-op, no new provider calls.
        $before = count(Http::recorded());
        $again = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$prebooked['id']}/cancel")
            ->assertOk()
            ->json();

        $this->assertSame('Cancelled', $again['status']);
        $this->assertSame($before, count(Http::recorded()));
    }

    public function test_non_os_travel_booking_flow_is_unaffected(): void
    {
        // A destination booking must never hit the provider or require pax.
        $destination = Destination::create([
            'slug' => 'hammamet',
            'name' => ['en' => 'Hammamet', 'fr' => 'Hammamet', 'ar' => 'الحمامات'],
            'country' => ['en' => 'Tunisia', 'fr' => 'Tunisie', 'ar' => 'تونس'],
            'category_key' => 'beach',
            'price' => 500,
            'rating' => 4.5,
            'image' => 'placeholder.jpg',
            'description' => ['en' => 'Coastal resort', 'fr' => 'Station balnéaire', 'ar' => 'منتجع ساحلي'],
        ]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/bookings', [
                'type' => 'destination',
                'item_slug' => $destination->slug,
                'client' => ['name' => 'Jane Doe', 'email' => 'jane@example.com'],
                'amount' => 500,
            ])
            ->assertCreated()
            ->json();

        $this->assertSame('destination', $response['type']);
        $this->assertSame('Pending', $response['status']);
        Http::assertNothingSent();
    }

    public function test_orphaned_and_pending_hotels_never_leak_publicly_after_resync(): void
    {
        // Sync once: hotel 178 arrives as PENDING, another staged row is
        // APPROVED, and a third is ORPHANED (as if a later sync dropped it).
        // None of these non-published states may ever appear in the public API.
        $this->fakeOsTravelChain();
        Artisan::call('os-travel:sync-catalog');

        $staged = OsTravelHotel::where('external_id', '178')->first();
        $this->assertSame(OsTravelHotel::PENDING, $staged->status);

        OsTravelHotel::create([
            'external_id' => '999',
            'payload_hash' => str_repeat('b', 64),
            'payload' => ['ListHotel' => [$this->osTravelHotelItem(999, 'Missing')]],
            'name' => 'Missing',
            'city_external_id' => '12',
            'status' => OsTravelHotel::APPROVED,
            'last_synced_at' => now()->subDay(),
        ]);

        $staged->update(['status' => OsTravelHotel::ORPHANED, 'prior_status' => OsTravelHotel::PENDING]);

        $publicIndex = collect($this->getJson('/api/hotels')->json())->pluck('slug');
        $this->assertNotContains('cap-bon-kelibia-beach-hotel-spa', $publicIndex->all());
        $this->assertNotContains('missing', $publicIndex->all());

        $this->getJson('/api/hotels/cap-bon-kelibia-beach-hotel-spa')->assertNotFound();
        $this->getJson('/api/hotels/missing')->assertNotFound();
    }

    public function test_republish_uses_shared_hotel_publisher(): void
    {
        // Guard the Phase 6 publish pipeline: approve -> republish in place.
        $staged = OsTravelHotel::create([
            'external_id' => '42',
            'payload' => [
                'ListHotel' => $this->osTravelHotelItem(42, 'Grand Hotel'),
                'HotelDetail' => ['HotelDetail' => ['Name' => 'Grand Hotel', 'Id' => 42]],
            ],
            'payload_hash' => str_repeat('a', 64),
            'name' => 'Grand Hotel',
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 5,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/grand.jpg',
            'status' => OsTravelHotel::PENDING,
            'last_synced_at' => now(),
        ]);

        Http::fake(['https://admin.mygo.co/file_manager/*' => Http::response('image-bytes')]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $first = Hotel::where('code', 'ostravel-42')->first();
        $this->assertNotNull($first);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();

        $this->assertSame(1, Hotel::where('code', 'ostravel-42')->count());
        $this->assertSame($first->id, Hotel::where('code', 'ostravel-42')->first()->id);
    }

    /**
     * Phase F manual-hotel variants: `instant` and `request` manual hotels live
     * side-by-side with the published provider hotel across the admin list,
     * public search and booking chain — without any provider call.
     */
    public function test_manual_hotel_variants_flow_through_admin_public_and_booking_chain(): void
    {
        $this->fakeOsTravelChain();
        Artisan::call('os-travel:sync-catalog');
        $staged = OsTravelHotel::where('external_id', '178')->first();
        $this->actingAs($this->admin)
            ->putJson("/api/admin/os-travel/hotels/{$staged->id}", [
                'markup_percentage' => 20,
                'currency' => 'TND',
            ])
            ->assertOk();
        $this->actingAs($this->admin)
            ->postJson("/api/admin/os-travel/hotels/{$staged->id}/approve")
            ->assertOk();
        $providerHotel = Hotel::first();

        // Two manual hotels: instant (auto-confirm) and request (needs admin).
        foreach (['instant', 'request'] as $i => $mode) {
            Hotel::create([
                'slug' => "maison-{$mode}",
                'code' => "hotel-manual-{$i}",
                'name' => ['en' => ucfirst($mode).' Maison', 'fr' => ucfirst($mode).' Maison', 'ar' => ucfirst($mode).' Maison'],
                'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
                'price' => 120,
                'base_price' => 100,
                'markup_percentage' => 20,
                'currency' => 'TND',
                'rating' => 4.0,
                'stars' => 3,
                'reviews' => 5,
                'image' => 'https://example.com/manual.jpg',
                'source' => 'manual',
                'booking_mode' => $mode,
            ]);
        }

        // Admin list exposes all three hotels (provider + both manual modes).
        $adminList = $this->actingAs($this->admin)->getJson('/api/admin/hotels')->assertOk()->json('data');
        $slugs = collect($adminList)->pluck('slug');
        $this->assertContains($providerHotel->slug, $slugs->all());
        $this->assertContains('maison-instant', $slugs->all());
        $this->assertContains('maison-request', $slugs->all());

        // Public search finds the manual hotels without any provider call
        // (the provider hotel's live search is covered separately above).
        Http::fake();
        $search = $this->postJson('/api/hotels/search', [
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-05',
            'hotel_slugs' => ['maison-instant', 'maison-request'],
        ])->assertOk()->json('data');

        $manualInstant = collect($search)->firstWhere('slug', 'maison-instant');
        $this->assertSame('manual', $manualInstant['provider']);
        $this->assertTrue($manualInstant['available']);
        $this->assertSame([], $manualInstant['rooms']);
        $manualRequest = collect($search)->firstWhere('slug', 'maison-request');
        $this->assertSame('manual', $manualRequest['provider']);
        Http::assertNothingSent();

        // Instant and request bookings both land Pending, then an admin approves —
        // all types go through the approval pipeline now, without provider calls.
        Http::fake();
        $instant = $this->actingAs($this->client)
            ->postJson('/api/bookings', [
                'type' => 'hotel',
                'item_slug' => 'maison-instant',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-05',
                'client' => ['name' => 'John Doe', 'email' => 'john@example.com', 'phone' => '123456789'],
                'amount' => 480,
            ])
            ->assertStatus(201)
            ->json();
        $this->assertSame('Pending', $instant['status']);

        $request = $this->actingAs($this->client)
            ->postJson('/api/bookings', [
                'type' => 'hotel',
                'item_slug' => 'maison-request',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-05',
                'client' => ['name' => 'Jane Roe', 'email' => 'jane@example.com', 'phone' => '123456789'],
                'amount' => 480,
            ])
            ->assertStatus(201)
            ->json();
        $this->assertSame('Pending', $request['status']);

        // Approve the instant booking and confirm the request-mode booking.
        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$instant['id']}/approve")
            ->assertOk();
        $this->assertDatabaseHas('bookings', [
            'id' => $instant['id'],
            'status' => 'Confirmed',
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$request['id']}/approve")
            ->assertOk();
        $this->assertDatabaseHas('bookings', [
            'id' => $request['id'],
            'status' => 'Confirmed',
        ]);
        Http::assertNothingSent();
    }
}
