<?php

namespace Database\Factories;

use App\Models\JpExerciseChoice;
use App\Models\JpExampleExercise;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpExerciseChoiceFactory extends Factory
{
    protected $model = JpExerciseChoice::class;

    public function definition(): array
    {
        return [
            'exercise_id' => JpExampleExercise::inRandomOrder()->value('id') ?? JpExampleExercise::factory(),
            'content' => $this->faker->word(),
            'is_correct' => false,
        ];
    }
}
