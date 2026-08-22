<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->timestamp('detail_fetched_at')->nullable()->after('last_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->dropColumn('detail_fetched_at');
        });
    }
};
