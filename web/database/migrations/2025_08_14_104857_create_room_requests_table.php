<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('room_requests', function (Blueprint $table) {
            $table->id();
            // requester info
            $table->string('name');
            $table->string('borrower_id');
            $table->string('year');         // "1st Year", etc.
            $table->string('department');   // CEIT | COT | CTE | CAS
            $table->string('course');

            // schedule
            $table->date('date');
            $table->time('time_in');
            $table->time('time_out');

            // room
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();

            // status
            $table->string('status')->default('pending'); // pending|approved|rejected|cancelled

            $table->timestamps();

            $table->index(['room_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_requests');
    }
};