<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->unsignedInteger('base_price')->nullable()->after('price');
            $table->decimal('markup_percentage', 5, 2)->nullable()->after('base_price');
            $table->string('currency', 3)->default('TND')->after('markup_percentage');
            $table->json('meta')->nullable()->after('details');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['base_price', 'markup_percentage', 'currency', 'meta']);
        });
    }
};
