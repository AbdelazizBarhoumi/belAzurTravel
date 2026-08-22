<?php

namespace App\Console\Commands;

use App\Services\OsTravel\OsTravelClient;
use Illuminate\Console\Command;

class DebugProviderSearch extends Command
{
    protected $signature = 'os-travel:debug-search {--ids=392,389 : Comma-separated provider external hotel IDs to search}';

    protected $description = 'Dump the raw OS-TRAVEL HotelSearch response to inspect for provider-side duplicates';

    public function handle(OsTravelClient $client): int
    {
        $ids = array_map('intval', explode(',', $this->option('ids')));

        $this->info('Calling OS-TRAVEL HotelSearch for hotel IDs: '.implode(', ', $ids));
        $this->newLine();

        $envelope = $client->hotelSearch([
            'BookingDetails' => [
                'CheckIn' => '2026-08-23',
                'CheckOut' => '2026-08-25',
                'Hotels' => $ids,
            ],
            'Filters' => [
                'OnlyAvailable' => false,
            ],
            'Rooms' => [['Adult' => 2, 'Child' => []]],
        ]);

        $hotels = $envelope['HotelSearch'] ?? [];

        $this->info('Provider returned '.count($hotels).' entries:');
        $this->newLine();

        foreach ($hotels as $i => $hotel) {
            $id = $hotel['Hotel']['Id'] ?? $hotel['Id'] ?? '?';
            $name = $hotel['Hotel']['Name'] ?? '?';
            $this->line("  [{$i}] Hotel ID={$id}  Name={$name}");
        }

        // Count by ID to highlight duplicates
        $counts = [];
        foreach ($hotels as $hotel) {
            $id = $hotel['Hotel']['Id'] ?? $hotel['Id'] ?? '?';
            $counts[$id] = ($counts[$id] ?? 0) + 1;
        }

        $this->newLine();
        $this->info('Duplicate check (grouped by Hotel ID):');
        foreach ($counts as $id => $count) {
            $label = $count > 1 ? '<error>DUPLICATE x'.$count.'</error>' : 'OK (unique)';
            $this->line("  Hotel ID {$id}: {$label}");
        }

        return self::SUCCESS;
    }
}
