<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->unsignedInteger('booking_expiry_hours')->default(72)->after('content');
            $table->unsignedInteger('trip_reminder_days')->default(3)->after('booking_expiry_hours');
            $table->string('digest_time')->default('08:00')->after('trip_reminder_days');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['booking_expiry_hours', 'trip_reminder_days', 'digest_time']);
        });
    }
};
