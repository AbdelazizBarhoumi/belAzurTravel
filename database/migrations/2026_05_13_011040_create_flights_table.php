<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->string('image')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flights');
    }
};
