<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The `published` status was collapsed into `approved`: a staging row is
     * approved when the admin gave the go-ahead, and whether it is actually
     * live is carried by its linked `hotels` row (`hotel_id`), not by status.
     * Convert existing published rows to approved — liveness is preserved
     * because they all have `hotel_id` set.
     */
    public function up(): void
    {
        DB::table('os_travel_hotels')
            ->where('status', 'published')
            ->update(['status' => 'approved']);
    }

    public function down(): void
    {
        // Not reversible: approved rows that were never published are
        // indistinguishable from the merged published rows.
    }
};
