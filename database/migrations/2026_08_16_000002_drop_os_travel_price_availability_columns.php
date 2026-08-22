<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remove the OS-TRAVEL stored price/availability columns. From now on only
 * ListHotel + HotelDetail catalog data is persisted; prices/availability are
 * always resolved live from the provider at search time. Existing bookings
 * keep their reserved prices (they live on `bookings`, not these columns).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->dropColumn([
                'base_price',
                'price_status',
                'availability_status',
                'first_available_at',
                'min_nights',
                'stop_sale_ranges',
                'last_price_attempt_at',
            ]);
        });

        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn([
                'last_price',
                'last_price_at',
                'first_available_at',
                'min_nights',
                'stop_sale_ranges',
            ]);
        });

        Schema::dropIfExists('os_travel_refresh_requests');
    }

    public function down(): void
    {
        Schema::table('os_travel_hotels', function (Blueprint $table) {
            $table->unsignedInteger('base_price')->nullable()->after('hotel_id');
            $table->string('price_status')->nullable();
            $table->string('availability_status')->nullable();
            $table->date('first_available_at')->nullable();
            $table->unsignedTinyInteger('min_nights')->nullable();
            $table->json('stop_sale_ranges')->nullable();
            $table->timestamp('last_price_attempt_at')->nullable();
        });

        Schema::table('hotels', function (Blueprint $table) {
            $table->decimal('last_price', 10, 2)->nullable();
            $table->timestamp('last_price_at')->nullable();
            $table->date('first_available_at')->nullable();
            $table->unsignedTinyInteger('min_nights')->nullable();
            $table->json('stop_sale_ranges')->nullable();
        });

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
            $table->text('error')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }
};
