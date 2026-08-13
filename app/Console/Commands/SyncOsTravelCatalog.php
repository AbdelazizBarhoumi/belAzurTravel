<?php

namespace App\Console\Commands;

use App\Services\OsTravel\OsTravelCatalogSync;
use Illuminate\Console\Command;
use Throwable;

class SyncOsTravelCatalog extends Command
{
    protected $signature = 'os-travel:sync-catalog';

    protected $description = 'Pull the OS-TRAVEL hotel catalog into staging tables';

    public function handle(OsTravelCatalogSync $sync): int
    {
        try {
            $result = $sync->sync();
        } catch (Throwable $e) {
            $this->error("OS-TRAVEL catalog sync failed: {$e->getMessage()}");

            return self::FAILURE;
        }

        if ($result === null) {
            $this->info('OS-TRAVEL catalog sync skipped (another run is still in progress).');

            return self::SUCCESS;
        }

        $this->info(
            "OS-TRAVEL catalog sync finished: {$result->status} "
            ."(countries: {$result->countries_count}, cities: {$result->cities_count}, "
            ."hotels: {$result->hotels_count}, details: {$result->details_count}, "
            ."orphaned: {$result->orphaned_count}, reactivated: {$result->reactivated_count})."
        );

        return self::SUCCESS;
    }
}
