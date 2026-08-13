<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('os_travel_reference', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('external_id');
            $table->string('code')->nullable();
            $table->string('name')->nullable();
            $table->json('payload');
            $table->foreignId('sync_id')->nullable()->constrained('os_travel_syncs')->nullOnDelete();
            $table->timestamps();

            $table->unique(['type', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('os_travel_reference');
    }
};