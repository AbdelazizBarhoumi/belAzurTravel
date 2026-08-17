<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow publishing OS-TRAVEL hotels that carry no provider image. The
     * `hotels.image` column was TEXT NOT NULL, so a hotel without an image
     * failed to publish with "Column 'image' cannot be null". On MySQL/MariaDB
     * the ALTER runs as raw SQL (see widen_hotel_image_columns for why).
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE hotels MODIFY image TEXT NULL');

            return;
        }

        Schema::table('hotels', function (Blueprint $table) {
            $table->text('image')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE hotels MODIFY image TEXT NOT NULL');

            return;
        }

        Schema::table('hotels', function (Blueprint $table) {
            $table->text('image')->change();
        });
    }
};