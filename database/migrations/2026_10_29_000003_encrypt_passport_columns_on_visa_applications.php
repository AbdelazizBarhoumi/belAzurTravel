<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Passport numbers are now stored encrypted (much longer than 30 chars) and
 * scans as encrypted blobs, so the original type/name are kept separately.
 * Existing data is encrypted by `php artisan passports:encrypt-existing`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->text('passport_number')->change();
            $table->string('passport_copy_mime', 100)->nullable()->after('passport_copy_path');
            $table->string('passport_copy_name', 255)->nullable()->after('passport_copy_mime');
        });
    }

    public function down(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->dropColumn(['passport_copy_mime', 'passport_copy_name']);
            $table->string('passport_number', 30)->change();
        });
    }
};
