<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('en_contexts', function (Blueprint $table) {
            $table->id();
            // $table->unsignedBigInteger('en_word_id')->unique();
            $table->unsignedBigInteger('en_word_id');
            $table->text('context_vi')->nullable();
            $table->timestamps();

            $table->foreign('en_word_id')->references('id')->on('en_words')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('en_contexts');
    }
};
