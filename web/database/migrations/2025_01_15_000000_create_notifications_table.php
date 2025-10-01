<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('user_email');
            $table->enum('type', ['success', 'error', 'info', 'warning']);
            $table->string('title');
            $table->text('message');
            $table->string('action_type')->nullable(); // 'item_request', 'room_request', 'cancel_item', 'cancel_room'
            $table->unsignedBigInteger('related_id')->nullable(); // ID of related request
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_email', 'is_read']);
            $table->index(['user_email', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
