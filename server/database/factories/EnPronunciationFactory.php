<?php

namespace Database\Factories;

use App\Models\EnPronunciation;
use App\Models\EnWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnPronunciationFactory extends Factory
{
    protected $model = EnPronunciation::class;

    public function definition(): array
    {
        return [
            'en_word_id' => EnWord::factory(),
            'audio_url' => $this->faker->url,
        ];
    }
}
