<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->string('availability_status')->nullable()->after('min_nights');
        });

        Schema::dropIfExists('os_travel_refresh_requests');
    }

    public function down(): void
    {
        Schema::create('os_travel_refresh_requests', function (Blueprint $table) {
            $table->id();
            $table->string('status')->default('pending');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('ids')->nullable();
            $table->date('check_in')->nullable();
            $table->date('check_out')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('updated')->default(0);
            $table->unsignedInteger('omitted')->default(0);
            $table->json('omitted_ids')->nullable();
            $table->json('failed_ids')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
            $table->index('status');
        });

        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->dropColumn('availability_status');
        });
    }
};
