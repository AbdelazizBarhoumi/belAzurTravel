<?php

namespace App\Console\Commands;

use App\Services\OsTravel\OsTravelRefreshProcessor;
use Illuminate\Console\Command;
use Throwable;

class ProcessOsTravelRefreshRequests extends Command
{
    protected $signature = 'os-travel:process-refresh-request';

    protected $description = 'Process a pending admin bulk price-refresh request';

    public function handle(OsTravelRefreshProcessor $processor): int
    {
        try {
            $request = $processor->process();
        } catch (Throwable $e) {
            $this->error("OS-TRAVEL refresh request failed: {$e->getMessage()}");

            return self::FAILURE;
        }

        if ($request === null) {
            $this->info('OS-TRAVEL refresh request skipped (none pending or another run in progress).');

            return self::SUCCESS;
        }

        $this->info(
            "OS-TRAVEL refresh request #{$request->id} finished: {$request->status} "
            ."(updated: {$request->updated}, omitted: {$request->omitted})."
        );

        return self::SUCCESS;
    }
}
