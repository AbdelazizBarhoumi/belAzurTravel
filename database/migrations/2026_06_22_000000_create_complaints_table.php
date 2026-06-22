<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
