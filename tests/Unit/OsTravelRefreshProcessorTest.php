<?php

namespace Tests\Unit;

use App\Models\OsTravelHotel;
use App\Models\OsTravelRefreshRequest;
use App\Services\OsTravel\OsTravelRefreshProcessor;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelRefreshProcessorTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
    }

    private function stagedHotel(int $id, string $name): OsTravelHotel
    {
        return OsTravelHotel::create([
            'external_id' => (string) $id,
            'payload' => [],
            'payload_hash' => str_repeat('c', 64),
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

    public function test_process_runs_pending_request_and_records_counts(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');
        $this->stagedHotel(999, 'Stop Sales Hotel');

        $request = OsTravelRefreshRequest::create([
            'status' => OsTravelRefreshRequest::PENDING,
            'requested_by' => null,
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response($this->osTravelFixture('hotel_search')),
        ]);

        $processed = app(OsTravelRefreshProcessor::class)->process();

        $this->assertSame($request->id, $processed->id);
        $this->assertSame(OsTravelRefreshRequest::COMPLETED, $processed->status);
        $this->assertSame(1, $processed->updated);
        // Stop Sales Hotel is returned but has no bookable room, so it has no
        // live price and counts as omitted.
        $this->assertSame(1, $processed->omitted);
        $this->assertNotNull($processed->started_at);
        $this->assertNotNull($processed->finished_at);

        $this->assertSame(928, OsTravelHotel::where('external_id', '178')->first()->base_price);
        $this->assertNull(OsTravelHotel::where('external_id', '999')->first()->base_price);
    }

    public function test_process_skips_when_nothing_is_pending(): void
    {
        Http::fake();

        $this->assertNull(app(OsTravelRefreshProcessor::class)->process());
        $this->assertSame(0, OsTravelRefreshRequest::count());
    }

    public function test_process_marks_request_failed_on_exception(): void
    {
        OsTravelRefreshRequest::create([
            'status' => OsTravelRefreshRequest::PENDING,
        ]);

        $search = $this->createMock(OsTravelSearchService::class);
        $search->expects($this->once())
            ->method('refreshStagedPrices')
            ->willThrowException(new \RuntimeException('boom'));
        $this->app->instance(OsTravelSearchService::class, $search);

        try {
            app(OsTravelRefreshProcessor::class)->process();
            $this->fail('Expected an exception to propagate.');
        } catch (\RuntimeException $e) {
            $this->assertSame('boom', $e->getMessage());
        }

        $request = OsTravelRefreshRequest::first();
        $this->assertSame(OsTravelRefreshRequest::FAILED, $request->status);
        $this->assertNotNull($request->finished_at);
        $this->assertSame('boom', $request->error);
    }

    public function test_process_uses_the_oldest_pending_request(): void
    {
        $first = OsTravelRefreshRequest::create([
            'status' => OsTravelRefreshRequest::PENDING,
            'updated' => 0,
        ]);
        OsTravelRefreshRequest::create([
            'status' => OsTravelRefreshRequest::PENDING,
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        $processed = app(OsTravelRefreshProcessor::class)->process();

        $this->assertSame($first->id, $processed->id);
    }

    public function test_process_skips_when_another_run_holds_the_lock(): void
    {
        $this->stagedHotel(178, 'Cap Bon Kelibia Beach Hotel & Spa');
        OsTravelRefreshRequest::create([
            'status' => OsTravelRefreshRequest::PENDING,
        ]);

        $lock = Cache::lock('os-travel-refresh', 600);
        $lock->get();

        Http::fake();

        $this->assertNull(app(OsTravelRefreshProcessor::class)->process());

        $lock->release();

        // Still pending (never picked up).
        $this->assertSame(OsTravelRefreshRequest::PENDING, OsTravelRefreshRequest::first()->status);
    }
}
