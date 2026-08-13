<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            'events' => ['date'],
            'deals' => ['expires'],
            'promos' => ['expires'],
        ] as $table => $columns) {
            Schema::table($table, function (Blueprint $table) use ($columns): void {
                foreach ($columns as $column) {
                    if (! Schema::hasColumn($table->getTable(), $column)) {
                        $table->json($column)->nullable();
                    }
                }
            });
        }
    }

    public function down(): void
    {
        foreach ([
            'events' => ['date'],
            'deals' => ['expires'],
            'promos' => ['expires'],
        ] as $table => $columns) {
            Schema::table($table, function (Blueprint $table) use ($columns): void {
                foreach ($columns as $column) {
                    $table->dropColumn($column);
                }
            });
        }
    }
};