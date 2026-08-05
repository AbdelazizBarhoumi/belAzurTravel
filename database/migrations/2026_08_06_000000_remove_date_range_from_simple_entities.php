<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const REVERT_TABLES = [
        'cars',
        'partners',
        'gallery_images',
        'teams',
        'blog_posts',
    ];

    public function up(): void
    {
        foreach (self::REVERT_TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                if (Schema::hasColumn($table->getTable(), 'date_to')) {
                    $table->dropColumn('date_to');
                }
                if (Schema::hasColumn($table->getTable(), 'date_from')) {
                    $table->dropColumn('date_from');
                }
            });
        }

        if (! Schema::hasColumn('blog_posts', 'date')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->string('date')->nullable()->after('id');
            });
        }

        DB::table('blog_posts')
            ->whereNull('date')
            ->update(['date' => now()->format('M d, Y')]);
    }

    public function down(): void
    {
        foreach (self::REVERT_TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                if (! Schema::hasColumn($table->getTable(), 'date_from')) {
                    $table->date('date_from')->nullable()->after('id');
                }
                if (! Schema::hasColumn($table->getTable(), 'date_to')) {
                    $table->date('date_to')->nullable()->after('date_from');
                }
            });
        }

        if (Schema::hasColumn('blog_posts', 'date')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->dropColumn('date');
            });
        }
    }
};
