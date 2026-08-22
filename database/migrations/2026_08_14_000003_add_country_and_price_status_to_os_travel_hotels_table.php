<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->string('country_external_id')->nullable()->index()->after('city_name');
            $table->string('country_name')->nullable()->after('country_external_id');
            $table->string('price_status')->nullable()->after('currency');
            $table->timestamp('last_price_attempt_at')->nullable()->after('price_status');
        });

        // Backfill country + price status for existing rows from the payload.
        DB::table('os_travel_hotels')->select(['id', 'payload', 'base_price'])->orderBy('id')->chunkById(500, function ($hotels) {
            foreach ($hotels as $hotel) {
                $payload = json_decode($hotel->payload ?? '{}', true);
                $list = $payload['ListHotel'] ?? [];
                $country = $list['City']['Country'] ?? $list['City'] ?? [];
                if (is_array($country)) {
                    $countryId = $country['Id'] ?? null;
                    $countryName = $country['Name'] ?? null;
                } else {
                    $countryId = null;
                    $countryName = is_string($country) && $country !== '' ? $country : null;
                }

                $status = $hotel->base_price !== null
                    ? 'has_price'
                    : 'never_refreshed';

                DB::table('os_travel_hotels')->where('id', $hotel->id)->update([
                    'country_external_id' => $countryId !== null ? (string) $countryId : null,
                    'country_name' => $countryName !== null ? (string) $countryName : null,
                    'price_status' => $status,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->dropColumn(['country_external_id', 'country_name', 'price_status', 'last_price_attempt_at']);
        });
    }
};
