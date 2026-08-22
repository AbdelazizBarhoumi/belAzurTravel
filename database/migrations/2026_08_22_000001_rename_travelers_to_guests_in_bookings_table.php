<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'travelers') && ! Schema::hasColumn('bookings', 'guests')) {
                $table->renameColumn('travelers', 'guests');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'guests') && ! Schema::hasColumn('bookings', 'travelers')) {
                $table->renameColumn('guests', 'travelers');
            }
        });
    }
};
