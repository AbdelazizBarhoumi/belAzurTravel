<?php

use App\Models\Amenity;
use App\Models\Hotel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Hotel::all()->each(function (Hotel $hotel) {
            $amenities = $hotel->amenities; // This is currently the JSON array

            if (is_array($amenities)) {
                foreach ($amenities as $amenityData) {
                    if (isset($amenityData['name'])) {
                        $amenityName = $amenityData['name'];
                        
                        // Try to find existing amenity by English name or create new
                        $amenity = Amenity::firstOrCreate(
                            ['name' => $amenityName],
                            ['icon' => $amenityData['icon'] ?? null]
                        );

                        $hotel->amenities()->syncWithoutDetaching([$amenity->id]);
                    }
                }
            }
        });
    }

    public function down(): void
    {
        DB::table('amenity_hotel')->truncate();
        DB::table('amenities')->truncate();
    }
};
