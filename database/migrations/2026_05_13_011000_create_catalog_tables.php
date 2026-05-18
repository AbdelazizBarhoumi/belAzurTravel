<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('name');
            $table->json('country');
            $table->string('category_key')->index();
            $table->json('category');
            $table->unsignedInteger('price')->default(0);
            $table->decimal('rating', 3, 1)->default(0);
            $table->string('image');
            $table->json('description');
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('code')->unique();
            $table->string('destination_slug')->nullable()->index();
            $table->json('name');
            $table->json('location');
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

        Schema::create('tours', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('name');
            $table->json('location');
            $table->json('duration')->nullable();
            $table->unsignedTinyInteger('duration_days')->nullable();
            $table->unsignedTinyInteger('duration_nights')->nullable();
            $table->unsignedInteger('max_group')->default(0);
            $table->unsignedInteger('price')->default(0);
            $table->decimal('rating', 3, 1)->default(0);
            $table->string('image');
            $table->json('description');
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('name');
            $table->json('category')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->unsignedTinyInteger('seats')->default(0);
            $table->json('fuel')->nullable();
            $table->json('transmission')->nullable();
            $table->string('image');
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->json('airline');
            $table->string('from');
            $table->json('to');
            $table->json('duration');
            $table->unsignedInteger('price')->default(0);
            $table->json('stops');
            $table->string('departure');
            $table->string('arrival');
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('location');
            $table->json('date');
            $table->unsignedInteger('price')->default(0);
            $table->string('image');
            $table->json('description');
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('description')->nullable();
            $table->json('discount')->nullable();
            $table->json('expires')->nullable();
            $table->json('category')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->json('title');
            $table->json('discount');
            $table->json('description')->nullable();
            $table->json('expires')->nullable();
            $table->string('color');
            $table->json('details')->nullable();
            $table->timestamps();
        });

        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('excerpt');
            $table->string('date');
            $table->json('category');
            $table->string('image');
            $table->json('content')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('promos');
        Schema::dropIfExists('deals');
        Schema::dropIfExists('events');
        Schema::dropIfExists('flights');
        Schema::dropIfExists('cars');
        Schema::dropIfExists('tours');
        Schema::dropIfExists('hotels');
        Schema::dropIfExists('destinations');
    }
};
