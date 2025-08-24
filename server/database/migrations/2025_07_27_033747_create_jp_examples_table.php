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
    Schema::create('jp_examples', function (Blueprint $table) {
        $table->id();
        $table->foreignId('jp_word_id')->constrained('jp_words')->onDelete('cascade');
        $table->text('sentence_jp');
        $table->text('sentence_hira')->nullable();
        $table->text('sentence_romaji')->nullable();
        $table->text('sentence_vi')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jp_examples');
    }
};
