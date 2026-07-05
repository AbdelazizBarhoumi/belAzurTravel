<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            // Tarifs et disponibilités
            $table->boolean('htel_recommande')->default(false);
            $table->boolean('tarifs_promo')->default(false);
            $table->boolean('enfant_gratuit')->default(false);
            $table->boolean('disponible_seulement')->default(false);
            $table->boolean('annulation_gratuite')->default(false);

            // Arrangements
            $table->boolean('logement_simple')->default(false);
            $table->boolean('petit_dejeuner')->default(false);
            $table->boolean('demi_pension')->default(false);
            $table->boolean('pension_complete')->default(false);

            // Catégorie
            $table->boolean('categorie_4_etoiles')->default(false);

            // Type de chambres
            $table->boolean('chambre_double')->default(false);
            $table->boolean('suite')->default(false);
            $table->boolean('chambre_standard')->default(false);
            $table->boolean('suite_junior')->default(false);

            // Service
            $table->boolean('thalasso_spa')->default(false);
            $table->boolean('nature_aventure')->default(false);
            $table->boolean('famille')->default(false);
            $table->boolean('affaires')->default(false);
            $table->boolean('sport_loisir')->default(false);
            $table->boolean('detente')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn([
                'htel_recommande', 'tarifs_promo', 'enfant_gratuit',
                'disponible_seulement', 'annulation_gratuite',
                'logement_simple', 'petit_dejeuner', 'demi_pension', 'pension_complete',
                'categorie_4_etoiles',
                'chambre_double', 'suite', 'chambre_standard', 'suite_junior',
                'thalasso_spa', 'nature_aventure', 'famille', 'affaires',
                'sport_loisir', 'detente',
            ]);
        });
    }
};
