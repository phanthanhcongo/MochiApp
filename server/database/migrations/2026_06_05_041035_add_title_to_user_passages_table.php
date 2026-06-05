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
        Schema::table('user_passages', function (Blueprint $table) {
            $table->string('title', 255)->after('user_id')->default('Untitled')->comment('Title of the passage/reading');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_passages', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};
