<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->date('first_available_at')->nullable()->after('last_price_attempt_at');
            $table->unsignedTinyInteger('min_nights')->nullable()->after('first_available_at');
        });

        Schema::table('hotels', function (Blueprint $table) {
            $table->date('first_available_at')->nullable()->after('last_price_at');
            $table->unsignedTinyInteger('min_nights')->nullable()->after('first_available_at');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['first_available_at', 'min_nights']);
        });

        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->dropColumn(['first_available_at', 'min_nights']);
        });
    }
};
