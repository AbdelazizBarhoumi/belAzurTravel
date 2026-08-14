<?php

namespace App\Console\Commands;

use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Console\Command;
use Throwable;

class RefreshOsTravelLatestPrices extends Command
{
    protected $signature = 'os-travel:refresh-latest-prices';

    protected $description = 'Refresh the latest known price for published OS-TRAVEL hotels via batched HotelSearch';

    public function handle(OsTravelSearchService $service): int
    {
        try {
            $result = $service->refreshLatestPrices();
        } catch (Throwable $e) {
            $this->error("OS-TRAVEL latest-price refresh failed: {$e->getMessage()}");

            return self::FAILURE;
        }

        $this->info(
            "OS-TRAVEL latest-price refresh finished: updated {$result['updated']} hotels, "
            ."{$result['omitted']} had no live per-night availability and their price was cleared."
        );

        return self::SUCCESS;
    }
}
