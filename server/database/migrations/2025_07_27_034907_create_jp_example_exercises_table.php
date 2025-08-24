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
    Schema::create('jp_example_exercises', function (Blueprint $table) {
        $table->id();
        $table->foreignId('example_id')->constrained('jp_examples')->onDelete('cascade');
        $table->string('question_type')->comment('multiple_choice | fill_in_blank | kanji_write');
        $table->text('question_text')->nullable();
        $table->integer('blank_position')->nullable()->comment('Vị trí chèn ô trống nếu có');
        $table->text('answer_explanation')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jp_example_exercises');
    }
};
