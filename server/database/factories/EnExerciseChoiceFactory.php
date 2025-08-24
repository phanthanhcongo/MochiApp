<?php

namespace Database\Factories;

use App\Models\EnExerciseChoice;
use App\Models\EnExampleExercise;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnExerciseChoiceFactory extends Factory
{
    protected $model = EnExerciseChoice::class;

    public function definition(): array
    {
        return [
            'exercise_id' => EnExampleExercise::factory(),
            'content' => $this->faker->word,
            'is_correct' => $this->faker->boolean(25), // 25% là đúng
        ];
    }
}
