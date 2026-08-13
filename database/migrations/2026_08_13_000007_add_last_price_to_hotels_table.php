<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->decimal('last_price', 10, 2)->nullable()->after('currency');
            $table->timestamp('last_price_at')->nullable()->after('last_price');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['last_price', 'last_price_at']);
        });
    }
};
