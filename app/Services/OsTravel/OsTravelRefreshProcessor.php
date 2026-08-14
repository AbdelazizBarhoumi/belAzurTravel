<?php

namespace App\Services\OsTravel;

use App\Models\OsTravelRefreshRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Processes pending admin bulk price-refresh requests outside the web request.
 *
 * Runs are single-flight (Cache lock) and driven by the scheduler
 * (`os-travel:process-refresh-request`), so a large refresh never blocks a
 * browser request.
 */
class OsTravelRefreshProcessor
{
    public function __construct(private OsTravelSearchService $search) {}

    /**
     * Process the oldest pending refresh request, or null when none is
     * pending or another run holds the single-flight lock.
     */
    public function process(): ?OsTravelRefreshRequest
    {
        $lock = Cache::lock('os-travel-refresh', config('ostravel.refresh.lock_ttl_minutes', 30) * 60);

        if (! $lock->get()) {
            Log::info('OS-TRAVEL refresh request skipped: another refresh is still in progress.');

            return null;
        }

        try {
            return $this->run();
        } finally {
            $lock->release();
        }
    }

    protected function run(): ?OsTravelRefreshRequest
    {
        $request = OsTravelRefreshRequest::query()
            ->where('status', OsTravelRefreshRequest::PENDING)
            ->orderBy('id')
            ->first();

        if ($request === null) {
            return null;
        }

        $request->update([
            'status' => OsTravelRefreshRequest::PROCESSING,
            'started_at' => now(),
        ]);

        try {
            $result = $this->search->refreshStagedPrices(
                $request->ids ?? [],
                [
                    'check_in' => $request->check_in?->toDateString(),
                    'check_out' => $request->check_out?->toDateString(),
                ]
            );

            $request->update([
                'status' => OsTravelRefreshRequest::COMPLETED,
                'updated' => $result['updated'],
                'omitted' => $result['omitted'],
                'omitted_ids' => $result['omitted_ids'],
                'failed_ids' => $result['failed_ids'],
                'finished_at' => now(),
            ]);
        } catch (Throwable $e) {
            Log::error('OS-TRAVEL refresh request failed.', [
                'refresh_request_id' => $request->id,
                'error' => $e->getMessage(),
            ]);

            $request->update([
                'status' => OsTravelRefreshRequest::FAILED,
                'error' => $e->getMessage(),
                'finished_at' => now(),
            ]);

            throw $e;
        }

        return $request->fresh();
    }
}
