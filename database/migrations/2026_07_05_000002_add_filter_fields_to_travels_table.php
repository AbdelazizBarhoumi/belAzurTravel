<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('travels', function (Blueprint $table) {
            // Destination
            $table->boolean('istanbul')->default(false);
            $table->boolean('asie')->default(false);
            $table->boolean('europe')->default(false);
            $table->boolean('afrique_nord')->default(false);

            // Jeunes
            $table->boolean('jeune')->default(false);

            // Niveau physique
            $table->boolean('tranquille')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('travels', function (Blueprint $table) {
            $table->dropColumn([
                'istanbul', 'asie', 'europe', 'afrique_nord',
                'jeune', 'tranquille',
            ]);
        });
    }
};
