<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            // Slug (or code for flights) — the same key the public pages use.
            $table->string('item_key');
            // Card data captured when saved, so the list renders without a
            // lookup per item and survives a catalogue item being unpublished.
            $table->json('snapshot')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'type', 'item_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
