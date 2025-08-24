<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('en_example_exercises', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('example_id');
            $table->string('question_type')->comment('multiple_choice | fill_in_blank');
            $table->text('question_text')->nullable();
            $table->integer('blank_position')->nullable()->comment('Vị trí chèn ô trống nếu có');
            $table->text('answer_explanation')->nullable();
            $table->timestamps();

            $table->foreign('example_id')->references('id')->on('en_examples')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('en_example_exercises');
    }
};
