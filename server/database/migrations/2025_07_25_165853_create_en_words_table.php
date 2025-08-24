<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('en_words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('word');
            $table->string('ipa')->nullable();
            $table->text('meaning_vi')->nullable();
            $table->string('cefr_level')->nullable()->comment('A1–C2');
            $table->integer('level')->nullable();
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamp('next_review_at')->nullable();
            $table->string('exampleEn')->nullable(); // ✅ Thêm dòng này
            $table->string('exampleVn')->nullable(); // ✅ Thêm dòng này

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('en_words');
    }
};
