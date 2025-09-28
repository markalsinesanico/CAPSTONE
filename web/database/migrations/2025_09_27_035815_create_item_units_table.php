<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('item_units', function (Blueprint $table) {
    $table->id();
    $table->foreignId('item_id')->constrained()->onDelete('cascade');
    $table->string('unit_code')->unique(); 
    $table->string('qr_path'); // always generated
    $table->enum('status', ['available','borrowed','maintenance'])->default('available');
    $table->timestamps();

    $table->index('item_id');
    $table->index('status');
});

    }

    public function down()
    {
        Schema::dropIfExists('item_units');
    }
};
