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
    Schema::create('jp_exercise_choices', function (Blueprint $table) {
        $table->id();
        $table->foreignId('exercise_id')->constrained('jp_example_exercises')->onDelete('cascade');
        $table->text('content');
        $table->boolean('is_correct')->default(false);
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jp_exercise_choices');
    }
};
