<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'tours',
        'travels',
        'hotels',
        'cars',
        'visas',
        'destinations',
        'events',
        'deals',
        'promos',
        'flights',
        'blog_posts',
        'partners',
        'gallery_images',
        'teams',
    ];

    private const DROP_COLUMNS = [
        'events' => ['date'],
        'deals' => ['expires'],
        'promos' => ['expires'],
        'blog_posts' => ['date'],
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                if (! Schema::hasColumn($table->getTable(), 'date_from')) {
                    $table->date('date_from')->nullable()->after('id');
                }
                if (! Schema::hasColumn($table->getTable(), 'date_to')) {
                    $table->date('date_to')->nullable()->after('date_from');
                }
            });
        }

        foreach (self::DROP_COLUMNS as $table => $columns) {
            Schema::table($table, function (Blueprint $table) use ($columns): void {
                foreach ($columns as $column) {
                    if (Schema::hasColumn($table->getTable(), $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                if (Schema::hasColumn($table->getTable(), 'date_to')) {
                    $table->dropColumn('date_to');
                }
                if (Schema::hasColumn($table->getTable(), 'date_from')) {
                    $table->dropColumn('date_from');
                }
            });
        }
    }
};
