<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->rebuildTable('payments', function (Blueprint $table) {
                $table->id();
                $table->uuid('booking_id')->nullable()->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedInteger('amount')->default(0);
                $table->string('currency', 3)->default('TND');
                $table->string('status')->default('paid')->index();
                $table->timestamp('paid_at')->nullable();
                $table->string('reference')->nullable()->unique();
                $table->string('clictopay_order_id')->nullable();
                $table->timestamps();
            });

            $this->rebuildTable('booking_audits', function (Blueprint $table) {
                $table->id();
                $table->uuid('booking_id')->nullable()->constrained()->cascadeOnDelete();
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('actor_role')->nullable();
                $table->string('action')->index();
                $table->string('from_status')->nullable();
                $table->string('to_status')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['booking_id', 'action']);
            });

            $this->rebuildTable('complaints', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type')->index();
                $table->json('subject');
                $table->json('description');
                $table->uuid('booking_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedInteger('refund_amount')->nullable();
                $table->string('status')->default('pending')->index();
                $table->string('priority')->default('medium')->index();
                $table->json('admin_reply')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
            });
        } else {
            $this->updateColumn('payments', 'booking_id');
            $this->updateColumn('booking_audits', 'booking_id');
            $this->updateColumn('complaints', 'booking_id');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->rebuildTable('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedInteger('amount')->default(0);
                $table->string('currency', 3)->default('TND');
                $table->string('status')->default('paid')->index();
                $table->timestamp('paid_at')->nullable();
                $table->string('reference')->nullable()->unique();
                $table->string('clictopay_order_id')->nullable();
                $table->timestamps();
            });

            $this->rebuildTable('booking_audits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('actor_role')->nullable();
                $table->string('action')->index();
                $table->string('from_status')->nullable();
                $table->string('to_status')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['booking_id', 'action']);
            });

            $this->rebuildTable('complaints', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type')->index();
                $table->json('subject');
                $table->json('description');
                $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedInteger('refund_amount')->nullable();
                $table->string('status')->default('pending')->index();
                $table->string('priority')->default('medium')->index();
                $table->json('admin_reply')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
            });
        } else {
            $this->revertColumn('payments', 'booking_id');
            $this->revertColumn('booking_audits', 'booking_id');
            $this->revertColumn('complaints', 'booking_id');
        }
    }

    private function rebuildTable(string $tableName, callable $blueprint): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        $newTable = $tableName.'_new';

        DB::transaction(function () use ($tableName, $newTable, $blueprint) {
            Schema::create($newTable, $blueprint);

            $rows = DB::table($tableName)->get();
            foreach ($rows as $row) {
                DB::table($newTable)->insert((array) $row);
            }

            Schema::dropIfExists($tableName);
            Schema::rename($newTable, $tableName);
        });
    }

    private function updateColumn(string $tableName, string $columnName): void
    {
        if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, $columnName)) {
            return;
        }

        $hasFk = DB::select(
            "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = 'bookings' AND TABLE_SCHEMA = DATABASE()",
            [$tableName, $columnName]
        )[0]->cnt > 0;

        if ($hasFk) {
            Schema::table($tableName, function (Blueprint $table) use ($columnName) {
                $table->dropForeign([$columnName]);
            });
        }

        Schema::table($tableName, function (Blueprint $table) use ($columnName) {
            $table->uuid($columnName)->nullable()->change();
        });

        Schema::table($tableName, function (Blueprint $table) use ($columnName) {
            $table->foreign($columnName)->references('id')->on('bookings')->cascadeOnDelete();
        });
    }

    private function revertColumn(string $tableName, string $columnName): void
    {
        if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, $columnName)) {
            return;
        }

        $hasFk = DB::select(
            "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = 'bookings' AND TABLE_SCHEMA = DATABASE()",
            [$tableName, $columnName]
        )[0]->cnt > 0;

        if ($hasFk) {
            Schema::table($tableName, function (Blueprint $table) use ($columnName) {
                $table->dropForeign([$columnName]);
            });
        }

        Schema::table($tableName, function (Blueprint $table) use ($columnName) {
            $table->unsignedBigInteger($columnName)->nullable()->change();
        });

        Schema::table($tableName, function (Blueprint $table) use ($columnName) {
            $table->foreign($columnName)->references('id')->on('bookings')->cascadeOnDelete();
        });
    }
};
