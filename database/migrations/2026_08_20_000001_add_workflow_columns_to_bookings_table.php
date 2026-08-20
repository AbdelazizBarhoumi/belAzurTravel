<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('rejected_at')->nullable()->after('cancelled_at');
            $table->timestamp('expires_at')->nullable()->after('rejected_at');
            $table->string('reject_reason')->nullable()->after('expires_at');
            $table->string('cancel_reason')->nullable()->after('reject_reason');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['rejected_at', 'expires_at', 'reject_reason', 'cancel_reason']);
        });
    }
};
