<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->json('itinerary')->nullable()->after('description');
            $table->json('includes')->nullable()->after('itinerary');
            $table->json('excludes')->nullable()->after('includes');
            $table->json('images')->nullable()->after('excludes');
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropColumn(['itinerary', 'includes', 'excludes', 'images']);
        });
    }
};
