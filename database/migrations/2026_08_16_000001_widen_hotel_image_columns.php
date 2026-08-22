<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Widen the image columns to TEXT. OS-TRAVEL image URLs can exceed
     * VARCHAR(255) once stored as opaque proxy tokens
     * (`/api/hotels/images/{encrypted-url}`), which made lazy publishing fail
     * with "Data too long for column 'image'".
     *
     * On MySQL/MariaDB the ALTER runs as raw SQL: Laravel's `->change()`
     * rebuilds the column with the table's charset/collation and MariaDB
     * surfaces that conversion as warning 1265 "Data truncated", which the
     * framework treats as a failure.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE hotels MODIFY image TEXT NOT NULL');
            DB::statement('ALTER TABLE os_travel_hotels MODIFY image TEXT NULL');

            return;
        }

        Schema::table('hotels', function (Blueprint $table) {
            $table->text('image')->change();
        });

        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->text('image')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE hotels MODIFY image VARCHAR(255) NOT NULL');
            DB::statement('ALTER TABLE os_travel_hotels MODIFY image VARCHAR(255) NULL');

            return;
        }

        Schema::table('hotels', function (Blueprint $table) {
            $table->string('image')->change();
        });

        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });
    }
};
