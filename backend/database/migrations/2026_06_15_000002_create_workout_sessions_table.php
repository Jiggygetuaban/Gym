<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('client_id');
            $table->string('name');
            $table->string('template_id')->nullable();
            $table->unsignedBigInteger('started_at_ms');
            $table->unsignedBigInteger('finished_at_ms');
            $table->unsignedInteger('duration');
            $table->json('exercises');
            $table->decimal('total_volume', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'client_id']);
            $table->index(['user_id', 'started_at_ms']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_sessions');
    }
};
