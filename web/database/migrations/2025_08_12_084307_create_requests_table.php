<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // borrower's name
            $table->string('borrower_id'); // borrower's id number
            $table->string('year');
            $table->string('department');
            $table->string('course');
            $table->date('date');
            $table->time('time_in');
            $table->time('time_out');
            $table->unsignedBigInteger('item_id');
            $table->string('status')->default('pending'); // add this line
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};