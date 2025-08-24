<?php

namespace Database\Factories;

use App\Models\JpExampleExercise;
use App\Models\JpExample;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpExampleExerciseFactory extends Factory
{
    protected $model = JpExampleExercise::class;

    public function definition(): array
    {
        return [
            'example_id' => JpExample::inRandomOrder()->value('id') ?? JpExample::factory(),
            'question_type' => $this->faker->randomElement(['multiple_choice', 'fill_in_blank', 'kanji_write']),
            'question_text' => $this->faker->sentence(),
            'blank_position' => $this->faker->numberBetween(0, 10),
            'answer_explanation' => $this->faker->sentence(),
        ];
    }
}
