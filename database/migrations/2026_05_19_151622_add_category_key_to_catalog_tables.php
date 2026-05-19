<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['hotels', 'tours', 'cars', 'events', 'deals', 'blog_posts'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'category_key')) {
                    $table->string('category_key')->nullable()->index()->after('slug');
                }
                
                // Ensure category column exists and is json
                if (!Schema::hasColumn($table->getTable(), 'category')) {
                    $table->json('category')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        $tables = ['hotels', 'tours', 'cars', 'events', 'deals', 'blog_posts'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn(['category_key']);
                // We keep 'category' if it was there before, but most didn't have it as a column
                // but as part of details or other fields.
                // However, for simplicity of down migration:
                // $table->dropColumn(['category']); 
            });
        }
    }
};
