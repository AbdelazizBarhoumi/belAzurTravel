<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entity_category_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type')->index();
            $table->unsignedBigInteger('entity_id')->index();
            $table->foreignId('category_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_value_id')->constrained('category_type_values')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(
                ['entity_type', 'entity_id', 'category_type_id'],
                'entity_cat_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_category_assignments');
    }
};
