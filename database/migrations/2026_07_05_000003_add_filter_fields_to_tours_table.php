<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            // Destination
            $table->boolean('djerba')->default(false);
            $table->boolean('nord_tunisien')->default(false);
            $table->boolean('sud_tunisien')->default(false);
            $table->boolean('tunisia')->default(false);

            // Niveau physique
            $table->boolean('tranquille')->default(false);

            // Famille
            $table->boolean('famille')->default(false);
            $table->boolean('djerba_by_vol')->default(false);

            // Jeunes
            $table->boolean('jeune')->default(false);

            // Region
            $table->boolean('nord')->default(false);

            // Voyages en groupe
            $table->boolean('tranquille_groupe')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropColumn([
                'djerba', 'nord_tunisien', 'sud_tunisien', 'tunisia',
                'tranquille', 'famille', 'djerba_by_vol', 'jeune',
                'nord', 'tranquille_groupe',
            ]);
        });
    }
};
