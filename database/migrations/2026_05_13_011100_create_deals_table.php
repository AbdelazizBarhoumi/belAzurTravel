<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category_key')->nullable()->index();
            $table->json('title');
            $table->json('description')->nullable();
            $table->json('discount')->nullable();
            $table->json('expires')->nullable();
            $table->json('category')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
