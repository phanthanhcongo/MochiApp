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
    Schema::create('jp_hanviet', function (Blueprint $table) {
        $table->id();
        $table->foreignId('jp_word_id')->constrained('jp_words')->onDelete('cascade');
        $table->string('han_viet')->nullable();
        $table->text('explanation')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jp_han_viets');
    }
};
