<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category_key')->nullable()->index();
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
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
