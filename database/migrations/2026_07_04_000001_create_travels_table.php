<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('travels', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category_key')->nullable()->index();
            $table->json('name');
            $table->json('description');
            $table->json('location');
            $table->json('category')->nullable();
            $table->json('duration')->nullable();
            $table->unsignedTinyInteger('duration_days')->nullable();
            $table->unsignedTinyInteger('duration_nights')->nullable();
            $table->unsignedInteger('max_group')->default(0);
            $table->unsignedInteger('price')->default(0);
            $table->decimal('rating', 3, 1)->default(0);
            $table->string('image');
            $table->json('itinerary')->nullable();
            $table->json('includes')->nullable();
            $table->json('excludes')->nullable();
            $table->json('images')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('travels');
    }
};
