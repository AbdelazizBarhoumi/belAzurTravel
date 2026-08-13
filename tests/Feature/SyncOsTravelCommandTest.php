<?php

namespace Tests\Feature;

use App\Models\OsTravelHotel;
use App\Models\OsTravelSync;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class SyncOsTravelCommandTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
    }

    public function test_command_runs_successfully_and_creates_rows(): void
    {
        $this->fakeOsTravelChain();

        $exit = Artisan::call('os-travel:sync-catalog');

        $this->assertSame(Command::SUCCESS, $exit);
        $this->assertSame(OsTravelSync::SUCCESS, OsTravelSync::first()->status);
        $this->assertSame(1, OsTravelHotel::count());
        $this->assertDatabaseCount('os_travel_reference', 65);
    }

    public function test_command_fails_when_sync_fails(): void
    {
        Http::fake([
            'https://admin.mygo.co/api/hotel/ListCountry' => Http::response('Service Unavailable', 500),
        ]);

        $exit = Artisan::call('os-travel:sync-catalog');

        $this->assertSame(Command::FAILURE, $exit);
        $this->assertSame(OsTravelSync::FAILED, OsTravelSync::first()->status);
    }

    public function test_command_skips_when_lock_is_held(): void
    {
        $lock = Cache::lock('os-travel-sync', config('ostravel.sync.lock_ttl_minutes') * 60);
        $lock->get();

        $exit = Artisan::call('os-travel:sync-catalog');

        $this->assertSame(Command::SUCCESS, $exit);
        $this->assertSame(0, OsTravelSync::count());

        $lock->release();
    }
}
