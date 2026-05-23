<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('hotels', 'amenities')) {
            return;
        }

        Schema::table('hotels', function (Blueprint $table): void {
            $table->dropColumn('amenities');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('hotels', 'amenities')) {
            return;
        }

        Schema::table('hotels', function (Blueprint $table): void {
            $table->json('amenities')->nullable()->after('image');
        });
    }
};
