<?php

namespace App\Console\Commands;

use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Console\Command;

class AssignPricingTypes extends Command
{
    protected $signature = 'hotels:assign-pricing-types';

    protected $description = 'Bulk-assign pricing_type category for all published provider hotels based on their boarding codes';

    public function handle(HotelPublisher $publisher): int
    {
        $staged = OsTravelHotel::whereNotNull('hotel_id')
            ->with('hotel')
            ->get();

        $total = $staged->count();
        $updated = 0;

        $this->newLine();
        $this->info("Processing {$total} published provider hotels...");

        foreach ($staged as $row) {
            $hotel = $row->hotel;
            if (! $hotel) {
                continue;
            }

            $detail = $row->payload['HotelDetail'] ?? [];
            $boardings = $detail['Boarding'] ?? [];

            $publisher->assignPricingType($hotel, $boardings);

            $updated++;
            $this->line("  [{$updated}/{$total}] Assigned pricing types for: {$hotel->slug}");
        }

        $this->newLine();
        $this->info("Done! Updated {$updated} hotels.");

        return self::SUCCESS;
    }
}
