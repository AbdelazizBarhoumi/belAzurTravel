<?php

use App\Models\Amenity;
use App\Models\Hotel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('hotels', 'amenities')) {
            return;
        }

        Hotel::query()->select(['id', 'amenities'])->get()->each(function (Hotel $hotel): void {
            $amenities = $hotel->getRawOriginal('amenities');

            if (is_string($amenities)) {
                $amenities = json_decode($amenities, true);
            }

            if (! is_array($amenities)) {
                return;
            }

            foreach ($amenities as $amenityData) {
                if (! is_array($amenityData) || ! isset($amenityData['name'])) {
                    continue;
                }

                $amenityName = $amenityData['name'];
                if (is_string($amenityName)) {
                    $amenityName = [
                        'en' => $amenityName,
                        'fr' => $amenityName,
                        'ar' => $amenityName,
                    ];
                }

                if (! is_array($amenityName)) {
                    continue;
                }

                $amenityName = [
                    'en' => trim((string) ($amenityName['en'] ?? '')),
                    'fr' => trim((string) ($amenityName['fr'] ?? '')),
                    'ar' => trim((string) ($amenityName['ar'] ?? '')),
                ];

                if ($amenityName['en'] === '' && $amenityName['fr'] === '' && $amenityName['ar'] === '') {
                    continue;
                }

                $amenity = Amenity::query()->updateOrCreate(
                    ['name' => $amenityName],
                    ['icon' => $amenityData['icon'] ?? null]
                );

                $hotel->amenities()->syncWithoutDetaching([$amenity->id]);
            }
        });
    }

    public function down(): void
    {
        DB::table('amenity_hotel')->truncate();
        DB::table('amenities')->truncate();
    }
};
