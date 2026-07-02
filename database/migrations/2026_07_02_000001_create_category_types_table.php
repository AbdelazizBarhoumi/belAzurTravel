<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_types', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type')->index();
            $table->string('key')->index();
            $table->json('label');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['entity_type', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_types');
    }
};
