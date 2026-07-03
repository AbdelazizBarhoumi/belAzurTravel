<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_types', function (Blueprint $table) {
            $table->string('filter_style')->default('pills')->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::table('category_types', function (Blueprint $table) {
            $table->dropColumn('filter_style');
        });
    }
};
