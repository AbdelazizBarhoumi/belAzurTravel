<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('BelAzurTravel');
            $table->string('email')->default('hello@voyageur.com');
            $table->string('phone')->default('+1 (555) 123-4567');
            $table->string('whatsapp')->nullable();
            $table->string('address')->nullable();
            $table->integer('year')->nullable();
            $table->json('social_links')->nullable();
            $table->json('legal_sections')->nullable();
            $table->json('footer_links')->nullable();
            $table->json('hours')->nullable();
            $table->json('content')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
