<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (! Schema::hasColumn('bookings', 'booking_ref')) {
                $table->unsignedBigInteger('booking_ref')->nullable()->after('id')->index();
            }
        });

        // Auto-assign sequential refs to existing bookings
        $bookings = DB::table('bookings')->orderBy('created_at')->orderBy('id')->get();
        foreach ($bookings as $index => $booking) {
            DB::table('bookings')
                ->where('id', $booking->id)
                ->update(['booking_ref' => $index + 1]);
        }

        // Make non-nullable and unique after population
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique('booking_ref');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['booking_ref']);
            $table->dropColumn('booking_ref');
        });
    }
};
