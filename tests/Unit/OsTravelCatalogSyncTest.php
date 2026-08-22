<?php

namespace Tests\Unit;

use App\Exceptions\OsTravelApiException;
use App\Models\OsTravelHotel;
use App\Models\OsTravelReference;
use App\Models\OsTravelSync;
use App\Services\OsTravel\OsTravelCatalogSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelCatalogSyncTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
    }

    public function test_sync_pulls_full_catalog_into_staging(): void
    {
        $this->fakeOsTravelChain([
            'ListCountry' => [
                'ListCountry' => [$this->osTravelFixture('list_country')['ListCountry'][1]],
                'CountResults' => 1,
                'ErrorMessage' => [],
            ],
        ]);

        $sync = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(OsTravelSync::SUCCESS, $sync->status);
        $this->assertSame(1, OsTravelSync::count());
        $this->assertSame(1, $sync->countries_count);
        $this->assertSame(7, $sync->cities_count);
        $this->assertSame(7, $sync->hotels_count);
        $this->assertSame(0, $sync->details_count);
        $this->assertSame(0, $sync->orphaned_count);
        $this->assertSame(0, $sync->reactivated_count);

        $this->assertSame(1, OsTravelReference::where('type', OsTravelReference::TYPE_COUNTRY)->count());
        $this->assertSame(7, OsTravelReference::where('type', OsTravelReference::TYPE_CITY)->count());
        $this->assertSame(40, OsTravelReference::where('type', OsTravelReference::TYPE_BOARDING)->count());
        $this->assertSame(11, OsTravelReference::where('type', OsTravelReference::TYPE_CATEGORY)->count());
        $this->assertSame(4, OsTravelReference::where('type', OsTravelReference::TYPE_CURRENCY)->count());

        $this->assertSame(1, OsTravelHotel::count());
        $hotel = OsTravelHotel::first();
        $this->assertSame('178', $hotel->external_id);
        $this->assertSame(OsTravelHotel::PENDING, $hotel->status);
        $this->assertNotNull($hotel->city_external_id);
        // Country is derived from the ListHotel payload's City.Country.
        $this->assertSame('219', $hotel->country_external_id);
        $this->assertSame('Tunisie', $hotel->country_name);
        $this->assertArrayHasKey('ListHotel', $hotel->payload);
        // Details are not fetched by the schedule; they fill on first visit.
        $this->assertArrayNotHasKey('HotelDetail', $hotel->payload);
        // The search-result image is downloaded into local storage.
        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
        $this->assertSame(
            'https://admin.mygo.co/file_manager/source/photos/tunisie/Kelibia/kelibia%20beach/Kelibia_Beach_8.jpg',
            $hotel->image_source
        );
        $this->assertSame(
            sha1(json_encode($this->osTravelFixture('list_hotel')['ListHotel'][0])),
            $hotel->payload_hash
        );

        Http::assertSent(fn ($request) => str_contains($request->url(), '/file_manager/source/photos/'));
    }

    public function test_rerun_is_idempotent_and_skips_unchanged_details(): void
    {
        $this->fakeOsTravelChain();

        $first = app(OsTravelCatalogSync::class)->sync();
        $second = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(OsTravelSync::SUCCESS, $second->status);
        $this->assertSame(1, OsTravelHotel::count());
        $this->assertSame(OsTravelHotel::PENDING, OsTravelHotel::first()->fresh()->status);
        $this->assertSame(0, $second->details_count);
        $this->assertSame(1, OsTravelHotel::where('external_id', '178')->count());
        $this->assertTrue($first->id !== $second->id);

        // The stored local image is reused across runs, never re-downloaded.
        $hotel = OsTravelHotel::first();
        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
        $this->assertSame(
            'https://admin.mygo.co/file_manager/source/photos/tunisie/Kelibia/kelibia%20beach/Kelibia_Beach_8.jpg',
            $hotel->image_source
        );
        $this->assertSame(
            1,
            collect(Http::recorded())
                ->filter(fn (array $pair) => str_contains($pair[0]->url(), '/file_manager/source/photos/'))
                ->count()
        );
    }

    public function test_resync_never_flips_approved_hotel_back_to_pending(): void
    {
        $this->fakeOsTravelChain();

        app(OsTravelCatalogSync::class)->sync();
        OsTravelHotel::first()->update(['status' => OsTravelHotel::APPROVED]);

        $this->fakeOsTravelChain();
        app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(OsTravelHotel::APPROVED, OsTravelHotel::first()->fresh()->status);
    }

    public function test_missing_hotel_is_marked_orphaned_with_prior_status(): void
    {
        $this->fakeOsTravelChain();
        app(OsTravelCatalogSync::class)->sync();

        OsTravelHotel::create([
            'external_id' => '999',
            'payload_hash' => str_repeat('b', 64),
            'payload' => ['ListHotel' => [$this->osTravelHotelItem(999, 'Missing')]],
            'name' => 'Missing',
            'city_external_id' => '12',
            'status' => OsTravelHotel::APPROVED,
            'last_synced_at' => now()->subDay(),
        ]);

        $this->fakeOsTravelChain();
        $sync = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(1, $sync->orphaned_count);
        $this->assertSame(0, $sync->reactivated_count);

        $orphaned = OsTravelHotel::where('external_id', '999')->first()->fresh();
        $this->assertSame(OsTravelHotel::ORPHANED, $orphaned->status);
        $this->assertSame(OsTravelHotel::APPROVED, $orphaned->prior_status);
    }

    public function test_reappearing_orphaned_hotel_is_reactivated_to_prior_status(): void
    {
        OsTravelHotel::create([
            'external_id' => '999',
            'payload_hash' => str_repeat('b', 64),
            'payload' => ['ListHotel' => [$this->osTravelHotelItem(999, 'Reappearing')]],
            'name' => 'Reappearing',
            'city_external_id' => '12',
            'status' => OsTravelHotel::ORPHANED,
            'prior_status' => OsTravelHotel::APPROVED,
            'last_synced_at' => now()->subDay(),
        ]);

        $this->fakeOsTravelChain([
            'ListHotel' => [
                'ListHotel' => [$this->osTravelHotelItem(999, 'Reappearing')],
                'CountResults' => 1,
                'ErrorMessage' => [],
            ],
        ]);

        $sync = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(1, $sync->reactivated_count);
        $this->assertSame(0, $sync->orphaned_count);

        $hotel = OsTravelHotel::where('external_id', '999')->first()->fresh();
        $this->assertSame(OsTravelHotel::APPROVED, $hotel->status);
        $this->assertNull($hotel->prior_status);
    }

    public function test_rejected_hotel_missing_from_catalog_is_orphaned_with_prior_status(): void
    {
        $this->fakeOsTravelChain();
        app(OsTravelCatalogSync::class)->sync();

        OsTravelHotel::create([
            'external_id' => '999',
            'payload_hash' => str_repeat('b', 64),
            'payload' => ['ListHotel' => [$this->osTravelHotelItem(999, 'Rejected')]],
            'name' => 'Rejected',
            'city_external_id' => '12',
            'status' => OsTravelHotel::REJECTED,
            'last_synced_at' => now()->subDay(),
        ]);

        $this->fakeOsTravelChain();
        $sync = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(1, $sync->orphaned_count);
        $this->assertSame(0, $sync->reactivated_count);

        $orphaned = OsTravelHotel::where('external_id', '999')->first()->fresh();
        $this->assertSame(OsTravelHotel::ORPHANED, $orphaned->status);
        $this->assertSame(OsTravelHotel::REJECTED, $orphaned->prior_status);
    }

    public function test_reappearing_orphaned_rejected_hotel_is_restored_to_rejected(): void
    {
        OsTravelHotel::create([
            'external_id' => '999',
            'payload_hash' => str_repeat('b', 64),
            'payload' => ['ListHotel' => [$this->osTravelHotelItem(999, 'Rejected')]],
            'name' => 'Rejected',
            'city_external_id' => '12',
            'status' => OsTravelHotel::ORPHANED,
            'prior_status' => OsTravelHotel::REJECTED,
            'last_synced_at' => now()->subDay(),
        ]);

        $this->fakeOsTravelChain([
            'ListHotel' => [
                'ListHotel' => [$this->osTravelHotelItem(999, 'Rejected')],
                'CountResults' => 1,
                'ErrorMessage' => [],
            ],
        ]);

        $sync = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(1, $sync->reactivated_count);
        $this->assertSame(0, $sync->orphaned_count);

        $hotel = OsTravelHotel::where('external_id', '999')->first()->fresh();
        $this->assertSame(OsTravelHotel::REJECTED, $hotel->status);
        $this->assertNull($hotel->prior_status);
    }

    public function test_api_failure_marks_sync_failed_preserves_rows_and_releases_lock(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response($this->osTravelFixture('list_country')),
            'https://admin.mygo.co/api/hotel/ListCity' => Http::response('Service Unavailable', 500),
        ]);

        try {
            app(OsTravelCatalogSync::class)->sync();
            $this->fail('Expected OsTravelApiException to be thrown.');
        } catch (OsTravelApiException $e) {
            $this->assertSame('ListCity', $e->endpoint());
        }

        $sync = OsTravelSync::first();
        $this->assertSame(OsTravelSync::FAILED, $sync->status);
        $this->assertNotNull($sync->error);
        $this->assertSame(3, OsTravelReference::count());

        $lock = Cache::lock('os-travel-sync', config('ostravel.sync.lock_ttl_minutes') * 60);
        $this->assertTrue($lock->get());
        $lock->release();
    }

    public function test_overlapping_run_is_skipped_without_creating_sync_row(): void
    {
        $lock = Cache::lock('os-travel-sync', config('ostravel.sync.lock_ttl_minutes') * 60);
        $lock->get();

        $result = app(OsTravelCatalogSync::class)->sync();

        $this->assertNull($result);
        $this->assertSame(0, OsTravelSync::count());

        $lock->release();
    }

    public function test_list_hotels_probes_pagination_and_loops(): void
    {
        $this->fakeOsTravelChain([
            'ListCountry' => [
                'ListCountry' => [$this->osTravelFixture('list_country')['ListCountry'][1]],
                'CountResults' => 1,
                'ErrorMessage' => [],
            ],
            'ListCity' => [
                'ListCity' => [$this->osTravelFixture('list_city')['ListCity'][0]],
                'CountResults' => 1,
                'ErrorMessage' => [],
            ],
            'ListHotel' => Http::sequence()
                ->push([
                    'ListHotel' => [$this->osTravelHotelItem(1, 'First Hotel')],
                    'Page' => 1,
                    'TotalPages' => 2,
                    'CountResults' => 1,
                    'ErrorMessage' => [],
                ])
                ->push([
                    'ListHotel' => [$this->osTravelHotelItem(2, 'Second Hotel')],
                    'Page' => 2,
                    'TotalPages' => 2,
                    'CountResults' => 1,
                    'ErrorMessage' => [],
                ]),
        ]);

        $sync = app(OsTravelCatalogSync::class)->sync();

        $this->assertSame(OsTravelSync::SUCCESS, $sync->status);
        $this->assertSame(2, OsTravelHotel::count());
        $this->assertSame(0, $sync->details_count);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/ListHotel')
            && data_get($request->data(), 'Paginator.Page') === 2);

        // Each hotel's search image is stored locally during the sync.
        foreach (OsTravelHotel::orderBy('external_id')->get() as $hotel) {
            $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
            $this->assertSame('https://admin.mygo.co/file_manager/source/photos/test.jpg', $hotel->image_source);
        }
    }

    public function test_failed_image_download_is_retried_on_next_sync(): void
    {
        $brokenImage = 'https://admin.mygo.co/file_manager/source/photos/broken.jpg';

        $listHotel = [
            'ListHotel' => [array_merge(
                $this->osTravelHotelItem(178, 'Cap Bon Kelibia Beach Hotel & Spa'),
                ['Image' => $brokenImage]
            )],
            'CountResults' => 1,
            'ErrorMessage' => [],
        ];

        // `Http::fake` appends stubs (first match wins), so a single stateful
        // closure flips the image endpoint between the two runs.
        $succeed = false;

        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response($this->osTravelFixture('list_country')),
            'https://admin.mygo.co/api/hotel/ListCity' => Http::response($this->osTravelFixture('list_city')),
            'https://admin.mygo.co/api/hotel/ListBoarding' => Http::response($this->osTravelFixture('list_boarding')),
            'https://admin.mygo.co/api/hotel/ListCategorie' => Http::response($this->osTravelFixture('list_categorie')),
            'https://admin.mygo.co/api/hotel/ListCurrency' => Http::response($this->osTravelFixture('list_currency')),
            'https://admin.mygo.co/api/hotel/ListHotel' => Http::response($listHotel),
            'https://admin.mygo.co/file_manager/*' => function () use (&$succeed) {
                return Http::response($succeed ? 'image-bytes' : '', $succeed ? 200 : 500);
            },
        ]);

        app(OsTravelCatalogSync::class)->sync();

        $hotel = OsTravelHotel::first();
        $this->assertNull($hotel->image);
        $this->assertNull($hotel->image_source);

        // The next run sees the same source URL and retries the download.
        $succeed = true;
        app(OsTravelCatalogSync::class)->sync();

        $hotel = OsTravelHotel::first()->fresh();
        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
        $this->assertSame($brokenImage, $hotel->image_source);
    }
}
