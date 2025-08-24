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
        Schema::create('jp_words', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('kanji');
        $table->string('reading_hiragana')->nullable();
        $table->string('reading_romaji')->nullable();
        $table->text('meaning_vi')->nullable();
        $table->string('jlpt_level')->nullable();
        $table->integer('level')->nullable();
        $table->timestamp('last_reviewed_at')->nullable();
        $table->timestamp('next_review_at')->nullable();
        $table->string('audio_url')->nullable(); // ✅ Thêm dòng này
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jp_words');
    }
};
