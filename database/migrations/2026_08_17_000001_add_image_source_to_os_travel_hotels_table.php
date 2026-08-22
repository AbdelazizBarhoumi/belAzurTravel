<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Track the provider URL a staged hotel's local `image` was downloaded
     * from, so the catalog sync re-downloads only when the search result's
     * image actually changed.
     */
    public function up(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->string('image_source')->nullable()->after('image');
        });
    }

    public function down(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->dropColumn('image_source');
        });
    }
};
