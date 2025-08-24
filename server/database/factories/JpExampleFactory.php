<?php

namespace Database\Factories;

use App\Models\JpExample;
use App\Models\JpWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpExampleFactory extends Factory
{
    protected $model = JpExample::class;

    public function definition(): array
    {
        return [
            'jp_word_id' => JpWord::inRandomOrder()->value('id') ?? JpWord::factory(),
            'sentence_jp' => $this->faker->sentence(8),
            'sentence_hira' => $this->faker->sentence(8),
            'sentence_romaji' => $this->faker->sentence(8),
            'sentence_vi' => $this->faker->sentence(10),
        ];
    }
}
