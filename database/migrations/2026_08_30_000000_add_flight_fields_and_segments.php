<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add new columns to flights
        Schema::table('flights', function (Blueprint $table) {
            $table->string('trip_type', 16)->nullable()->after('code');
            $table->boolean('direct_only')->default(false)->after('trip_type');
            $table->boolean('baggage_included')->default(false)->after('direct_only');
        });

        // 2. Convert `to` from JSON to string(3) for IATA codes.
        //    First add a temp column, migrate data, drop old, rename.
        Schema::table('flights', function (Blueprint $table) {
            $table->string('to_iata', 3)->nullable()->after('from');
        });

        // Migrate JSON city names → IATA codes
        $cityToIata = [
            'Paris' => 'CDG', 'Istanbul' => 'IST', 'Dubai' => 'DXB', 'Dubaï' => 'DXB',
            'Marrakech' => 'RAK', 'Cairo' => 'CAI', 'Le Caire' => 'CAI',
            'London' => 'LHR', 'Londres' => 'LHR', 'Bangkok' => 'BKK',
            'Rome' => 'FCO', 'Geneva' => 'ZRH', 'Genève' => 'ZRH',
            'Casablanca' => 'CMN', 'Munich' => 'MUC',
        ];

        $flights = DB::table('flights')->get();
        foreach ($flights as $flight) {
            $to = $flight->to;
            $iata = null;

            if (is_string($to) && str_starts_with(trim($to), '{')) {
                $decoded = json_decode($to, true);
                if (is_array($decoded)) {
                    $cityName = trim($decoded['en'] ?? $decoded['fr'] ?? $decoded['ar'] ?? '');
                    $iata = $cityToIata[$cityName] ?? null;
                }
            } elseif (is_string($to) && preg_match('/\(([A-Z]{3})\)/', $to, $m)) {
                $iata = $m[1];
            } elseif (is_string($to) && preg_match('/^[A-Z]{3}$/', trim($to))) {
                $iata = trim($to);
            }

            DB::table('flights')->where('id', $flight->id)->update([
                'to_iata' => $iata ?? '???',
            ]);
        }

        // Drop old JSON column and rename temp to `to`
        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn('to');
        });
        Schema::table('flights', function (Blueprint $table) {
            $table->renameColumn('to_iata', 'to');
        });

        // Make `to` non-nullable now that data is migrated
        DB::statement('ALTER TABLE flights MODIFY `to` VARCHAR(3) NOT NULL DEFAULT ""');

        // 3. Create flight_segments table
        Schema::create('flight_segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('segment_order')->default(0);
            $table->string('from_airport', 3);
            $table->string('to_airport', 3);
            $table->string('departure_time', 8)->nullable();
            $table->string('arrival_time', 8)->nullable();
            $table->date('date')->nullable();
            $table->string('duration', 32)->nullable();
            $table->timestamps();

            $table->index(['flight_id', 'segment_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flight_segments');

        // Restore `to` as JSON column
        Schema::table('flights', function (Blueprint $table) {
            $table->json('to')->nullable()->after('from');
        });

        // Copy IATA back as JSON object (best-effort reverse)
        $iataToCity = [
            'CDG' => 'Paris', 'IST' => 'Istanbul', 'DXB' => 'Dubai',
            'RAK' => 'Marrakech', 'CAI' => 'Cairo', 'LHR' => 'London',
            'BKK' => 'Bangkok', 'FCO' => 'Rome', 'ZRH' => 'Geneva',
            'CMN' => 'Casablanca', 'MUC' => 'Munich',
        ];
        foreach (DB::table('flights')->get() as $flight) {
            $city = $iataToCity[$flight->to] ?? $flight->to;
            DB::table('flights')->where('id', $flight->id)->update([
                'to' => DB::raw("'" . addslashes(json_encode(['en' => $city, 'fr' => $city, 'ar' => $city])) . "'"),
            ]);
        }

        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn('to');
        });

        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn(['trip_type', 'direct_only', 'baggage_included']);
        });
    }
};
