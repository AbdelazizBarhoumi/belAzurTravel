<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('provider_booking_id')->nullable()->after('cancelled_at');
            $table->string('provider_booking_reference')->nullable()->after('provider_booking_id');
            $table->json('provider_payload')->nullable()->after('provider_booking_reference');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['provider_booking_id', 'provider_booking_reference', 'provider_payload']);
        });
    }
};
