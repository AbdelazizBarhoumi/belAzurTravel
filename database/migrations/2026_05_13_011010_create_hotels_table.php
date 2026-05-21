<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category_key')->nullable()->index();
            $table->string('code')->unique();
            $table->string('destination_slug')->nullable()->index();
            $table->json('name');
            $table->json('location');
            $table->json('category')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->decimal('rating', 3, 1)->default(0);
            $table->unsignedTinyInteger('stars')->default(0);
            $table->unsignedInteger('reviews')->default(0);
            $table->string('image');
            $table->json('amenities')->nullable();
            $table->json('tags')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};