<?php

namespace Database\Factories;

use App\Models\EnPartOfSpeech;
use App\Models\EnWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnPartOfSpeechFactory extends Factory
{
    protected $model = EnPartOfSpeech::class;

    public function definition(): array
    {
        return [
            'en_word_id' => EnWord::factory(),
            'pos' => $this->faker->randomElement(['noun', 'verb', 'adjective', 'adverb']),
            'note' => $this->faker->sentence,
        ];
    }
}
