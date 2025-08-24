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
        Schema::create('en_examples', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('en_word_id');
            $table->text('sentence_en');
            $table->text('sentence_vi')->nullable();
            $table->timestamps();
            $table->foreign('en_word_id')->references('id')->on('en_words')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('en_examples');
    }
};
