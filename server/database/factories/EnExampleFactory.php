<?php

namespace Database\Factories;

use App\Models\EnExample;
use App\Models\EnWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnExampleFactory extends Factory
{
    protected $model = EnExample::class;

    public function definition(): array
    {
        return [
            'en_word_id' => EnWord::inRandomOrder()->value('id') ?? EnWord::factory(),
            'sentence_en' => $this->faker->sentence(8),
            'sentence_vi' => $this->faker->sentence(10),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
