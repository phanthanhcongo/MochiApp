<?php

namespace Database\Factories;

use App\Models\EnExampleExercise;
use App\Models\EnExample;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnExampleExerciseFactory extends Factory
{
    protected $model = EnExampleExercise::class;

    public function definition(): array
    {
        return [
            'example_id' => EnExample::factory(),
            'question_type' => $this->faker->randomElement(['multiple_choice', 'fill_in_blank']),
            'question_text' => $this->faker->sentence,
            'blank_position' => $this->faker->numberBetween(0, 5),
            'answer_explanation' => $this->faker->paragraph,
        ];
    }
}
