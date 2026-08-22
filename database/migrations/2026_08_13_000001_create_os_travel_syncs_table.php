<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('os_travel_syncs', function (Blueprint $table) {
            $table->id();
            $table->string('batch')->index();
            $table->string('status')->default('running');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('countries_count')->default(0);
            $table->unsignedInteger('cities_count')->default(0);
            $table->unsignedInteger('hotels_count')->default(0);
            $table->unsignedInteger('details_count')->default(0);
            $table->unsignedInteger('orphaned_count')->default(0);
            $table->unsignedInteger('reactivated_count')->default(0);
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('os_travel_syncs');
    }
};
