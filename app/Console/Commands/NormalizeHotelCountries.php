<?php

namespace App\Console\Commands;

use App\Models\Hotel;
use App\Support\CityNames;
use App\Support\CountryNames;
use Illuminate\Console\Command;

class NormalizeHotelCountries extends Command
{
    protected $signature = 'hotels:normalize-locations';

    protected $description = 'Rewrite hotels location/city/country fields to canonical en/fr/ar names';

    public function handle(): int
    {
        $updated = 0;
        $skipped = 0;

        Hotel::query()->chunkById(200, function ($hotels) use (&$updated, &$skipped) {
            foreach ($hotels as $hotel) {
                $details = $hotel->details;
                $dirty = false;

                // Country
                $canonical = CountryNames::normalize($details['country'] ?? null);
                if ($canonical !== null && ($details['country'] ?? null) !== $canonical) {
                    $details['country'] = $canonical;
                    $dirty = true;
                }

                // City
                $canonical = CityNames::normalize($details['city'] ?? null);
                if ($canonical !== null && ($details['city'] ?? null) !== $canonical) {
                    $details['city'] = $canonical;
                    $dirty = true;
                }

                // Location: only canonicalize when it is a plain city name
                // (free-form addresses like "Port El Kantaoui" are kept as-is).
                $canonical = CityNames::normalize($hotel->location);
                if ($canonical !== null && $hotel->location !== $canonical) {
                    $hotel->location = $canonical;
                    $dirty = true;
                }

                if (! $dirty) {
                    $skipped++;

                    continue;
                }

                $hotel->details = $details;
                $hotel->save();
                $updated++;
            }
        });

        $this->info("Hotel location normalization finished: {$updated} updated, {$skipped} unchanged.");

        return self::SUCCESS;
    }
}
