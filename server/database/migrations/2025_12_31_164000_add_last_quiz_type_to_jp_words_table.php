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
        Schema::table('jp_words', function (Blueprint $table) {
            $table->string('last_quiz_type')->nullable()->after('lapses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jp_words', function (Blueprint $table) {
            $table->dropColumn('last_quiz_type');
        });
    }
};
