<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_types', function (Blueprint $table) {
            $table->boolean('multi')->default(false)->after('locked');
        });
    }

    public function down(): void
    {
        Schema::table('category_types', function (Blueprint $table) {
            $table->dropColumn('multi');
        });
    }
};
