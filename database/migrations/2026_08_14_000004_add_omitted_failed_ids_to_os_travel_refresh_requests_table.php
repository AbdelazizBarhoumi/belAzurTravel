<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('os_travel_refresh_requests', function (Blueprint $table) {
            $table->json('omitted_ids')->nullable()->after('omitted');
            $table->json('failed_ids')->nullable()->after('omitted_ids');
        });
    }

    public function down(): void
    {
        Schema::table('os_travel_refresh_requests', function (Blueprint $table) {
            $table->dropColumn(['omitted_ids', 'failed_ids']);
        });
    }
};
