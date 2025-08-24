<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('en_exercise_choices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('exercise_id');
            $table->text('content');
            $table->boolean('is_correct')->default(false);
            $table->timestamps();

            $table->foreign('exercise_id')->references('id')->on('en_example_exercises')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('en_exercise_choices');
    }
};
