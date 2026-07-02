<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_type_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_type_id')->constrained()->cascadeOnDelete();
            $table->string('key')->index();
            $table->json('name');
            $table->timestamps();

            $table->unique(['category_type_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_type_values');
    }
};
