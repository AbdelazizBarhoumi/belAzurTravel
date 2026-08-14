<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->string('source')->default('manual')->after('currency');
            $table->string('booking_mode')->default('instant')->after('source');
        });

        // Backfill: hotels wired to a published OS-TRAVEL staging row are
        // provider hotels; everything else stays the manual default.
        DB::table('hotels')
            ->whereIn('id', DB::table('os_travel_hotels')
                ->where('status', 'published')
                ->whereNotNull('hotel_id')
                ->pluck('hotel_id'))
            ->update(['source' => 'ostravel']);
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['source', 'booking_mode']);
        });
    }
};
