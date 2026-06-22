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
            $table->string('email')->default('contact@belazurtravel.com');
            $table->string('phone')->default('+216 23 777 771');
            $table->string('whatsapp')->nullable();
            $table->string('address')->nullable();
            $table->string('plus_code')->nullable();
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
