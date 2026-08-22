<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('os_travel_hotels', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique();
            $table->foreignId('sync_id')->nullable()->constrained('os_travel_syncs')->nullOnDelete();
            $table->json('payload');
            $table->string('payload_hash', 64);
            $table->string('name');
            $table->string('city_external_id')->index();
            $table->string('city_name')->nullable();
            $table->string('category_title')->nullable();
            $table->unsignedTinyInteger('stars')->nullable();
            $table->string('image')->nullable();
            $table->string('status')->default('pending');
            $table->foreignId('hotel_id')->nullable()->constrained('hotels')->nullOnDelete();
            $table->unsignedInteger('base_price')->nullable();
            $table->decimal('markup_percentage', 5, 2)->nullable();
            $table->string('currency', 3)->default('TND');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('os_travel_hotels');
    }
};
