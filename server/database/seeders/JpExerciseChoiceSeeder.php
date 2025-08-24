<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpExampleExercise;
use App\Models\JpExerciseChoice;

class JpExerciseChoiceSeeder extends Seeder
{
    public function run(): void
    {
        JpExampleExercise::all()->each(function ($exercise) {
            $correctIndex = rand(0, 3);

            for ($i = 0; $i < 4; $i++) {
                JpExerciseChoice::factory()->create([
                    'exercise_id' => $exercise->id,
                    'is_correct' => $i === $correctIndex,
                ]);
            }
        });
    }
}
