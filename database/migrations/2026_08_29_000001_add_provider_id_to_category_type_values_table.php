<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_type_values', function (Blueprint $table) {
            $table->unsignedBigInteger('provider_id')->nullable()->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('category_type_values', function (Blueprint $table) {
            $table->dropColumn('provider_id');
        });
    }
};
