<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            if (!Schema::hasColumn('requests', 'email')) {
                $table->string('email')->nullable()->after('borrower_id');
            }
        });

        Schema::table('room_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('room_requests', 'email')) {
                $table->string('email')->nullable()->after('borrower_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            if (Schema::hasColumn('requests', 'email')) {
                $table->dropColumn('email');
            }
        });

        Schema::table('room_requests', function (Blueprint $table) {
            if (Schema::hasColumn('room_requests', 'email')) {
                $table->dropColumn('email');
            }
        });
    }
};
