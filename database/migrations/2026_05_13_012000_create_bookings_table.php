<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                if (! Schema::hasColumn('bookings', 'item_slug')) {
                    $table->string('item_slug')->nullable()->index()->after('type');
                }
                if (! Schema::hasColumn('bookings', 'item_id')) {
                    $table->string('item_id')->nullable()->index()->after('item_slug');
                }
                if (! Schema::hasColumn('bookings', 'start_date')) {
                    $table->date('start_date')->nullable()->after('items');
                }
                if (! Schema::hasColumn('bookings', 'end_date')) {
                    $table->date('end_date')->nullable()->after('start_date');
                }
                if (! Schema::hasColumn('bookings', 'client')) {
                    $table->json('client')->nullable()->after('end_date');
                }
                if (! Schema::hasColumn('bookings', 'travelers')) {
                    $table->json('travelers')->nullable()->after('client');
                }
                if (! Schema::hasColumn('bookings', 'promo_code')) {
                    $table->string('promo_code')->nullable()->after('travelers');
                }
                if (! Schema::hasColumn('bookings', 'notes')) {
                    $table->text('notes')->nullable()->after('promo_code');
                }
                if (! Schema::hasColumn('bookings', 'confirmed_at')) {
                    $table->timestamp('confirmed_at')->nullable()->after('status');
                }
                if (! Schema::hasColumn('bookings', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable()->after('confirmed_at');
                }
            });

            return;
        }

        Schema::create('bookings', function (Blueprint $table) {
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
            $table->string('promo_code')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_amount')->default(0);
            $table->string('status')->default('Pending')->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
