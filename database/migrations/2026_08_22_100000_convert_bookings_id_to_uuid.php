<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->migrateSqlite();
        } else {
            $this->migrateMySqlOrPostgres();
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->rollbackSqlite();
        } else {
            $this->rollbackMySqlOrPostgres();
        }
    }

    private function migrateSqlite(): void
    {
        DB::transaction(function () {
            // 1. Create new table with UUID primary key
            Schema::create('bookings_new', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type')->index();
                $table->string('item_slug')->nullable()->index();
                $table->string('item_id')->nullable()->index();
                $table->json('items')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->json('client');
                $table->json('travelers')->nullable();
                $table->json('guests')->nullable();
                $table->string('promo_code')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedInteger('total_amount')->default(0);
                $table->string('status')->default('Pending')->index();
                $table->timestamp('confirmed_at')->nullable();
                $table->timestamp('cancelled_at')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('reject_reason')->nullable();
                $table->string('cancel_reason')->nullable();
                $table->boolean('is_request')->default(false);
                $table->string('provider_booking_id')->nullable();
                $table->string('provider_booking_reference')->nullable();
                $table->json('provider_payload')->nullable();
                $table->json('details')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'status']);
            });

            // 2. Copy data with generated UUIDs
            $bookings = DB::table('bookings')->get();
            foreach ($bookings as $booking) {
                $uuid = (string) Str::uuid();
                DB::table('bookings_new')->insert((array) $booking + ['id' => $uuid]);
            }

            // 3. Drop old table
            Schema::dropIfExists('bookings');

            // 4. Rename new table
            Schema::rename('bookings_new', 'bookings');
        });
    }

    private function migrateMySqlOrPostgres(): void
    {
        // 1. Drop FK constraints on child tables that reference bookings (while old table still exists)
        $childTables = ['payments' => 'booking_id', 'complaints' => 'booking_id', 'booking_audits' => 'booking_id'];
        foreach ($childTables as $table => $column) {
            if (Schema::hasTable($table) && DB::select("SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = 'bookings' AND TABLE_SCHEMA = DATABASE()", [$table, $column])[0]->cnt > 0) {
                Schema::table($table, function (Blueprint $t) use ($column) {
                    $t->dropForeign([$column]);
                });
            }
        }

        // 2. Create new table with UUID primary key
        Schema::create('bookings_new', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->index();
            $table->string('item_slug')->nullable()->index();
            $table->string('item_id')->nullable()->index();
            $table->json('items')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->json('client');
            $table->json('travelers')->nullable();
            $table->json('guests')->nullable();
            $table->string('promo_code')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_amount')->default(0);
            $table->string('status')->default('Pending')->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('reject_reason')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->boolean('is_request')->default(false);
            $table->string('provider_booking_id')->nullable();
            $table->string('provider_booking_reference')->nullable();
            $table->json('provider_payload')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        // 3. Copy data with generated UUIDs
        $bookings = DB::table('bookings')->get();
        foreach ($bookings as $booking) {
            $uuid = (string) Str::uuid();
            DB::table('bookings_new')->insert((array) $booking + ['id' => $uuid]);
        }

        // 4. Drop old table
        Schema::dropIfExists('bookings');

        // 5. Rename new table
        Schema::rename('bookings_new', 'bookings');
    }

    private function rollbackSqlite(): void
    {
        DB::transaction(function () {
            Schema::create('bookings_old', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type')->index();
                $table->string('item_slug')->nullable()->index();
                $table->string('item_id')->nullable()->index();
                $table->json('items')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->json('client');
                $table->json('travelers')->nullable();
                $table->json('guests')->nullable();
                $table->string('promo_code')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedInteger('total_amount')->default(0);
                $table->string('status')->default('Pending')->index();
                $table->timestamp('confirmed_at')->nullable();
                $table->timestamp('cancelled_at')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('reject_reason')->nullable();
                $table->string('cancel_reason')->nullable();
                $table->boolean('is_request')->default(false);
                $table->string('provider_booking_id')->nullable();
                $table->string('provider_booking_reference')->nullable();
                $table->json('provider_payload')->nullable();
                $table->json('details')->nullable();
                $table->timestamps();
            });

            $bookings = DB::table('bookings')->get();
            foreach ($bookings as $booking) {
                DB::table('bookings_old')->insert((array) $booking);
            }

            Schema::dropIfExists('bookings');
            Schema::rename('bookings_old', 'bookings');
        });
    }

    private function rollbackMySqlOrPostgres(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        Schema::create('bookings_old', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->index();
            $table->string('item_slug')->nullable()->index();
            $table->string('item_id')->nullable()->index();
            $table->json('items')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->json('client');
            $table->json('travelers')->nullable();
            $table->json('guests')->nullable();
            $table->string('promo_code')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_amount')->default(0);
            $table->string('status')->default('Pending')->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('reject_reason')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->boolean('is_request')->default(false);
            $table->string('provider_booking_id')->nullable();
            $table->string('provider_booking_reference')->nullable();
            $table->json('provider_payload')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });

        $bookings = DB::table('bookings')->get();
        foreach ($bookings as $booking) {
            DB::table('bookings_old')->insert((array) $booking);
        }

        Schema::dropIfExists('bookings');
        Schema::rename('bookings_old', 'bookings');

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
    }
};
