<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entity_category_assignments', function (Blueprint $table) {
            $table->dropUnique('entity_cat_unique');
            $table->unique(
                ['entity_type', 'entity_id', 'category_type_id', 'category_value_id'],
                'entity_cat_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('entity_category_assignments', function (Blueprint $table) {
            $table->dropUnique('entity_cat_unique');
            $table->unique(
                ['entity_type', 'entity_id', 'category_type_id'],
                'entity_cat_unique'
            );
        });
    }
};
