<?php

namespace Database\Factories;

use App\Models\JpStroke;
use App\Models\JpWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpStrokeFactory extends Factory
{
    protected $model = JpStroke::class;

    public function definition(): array
    {
        return [
            'jp_word_id' => JpWord::inRandomOrder()->value('id') ?? JpWord::factory(),
            'stroke_url' => $this->faker->imageUrl(640, 480, 'abstract', true, 'kanji-stroke'),
        ];
    }
}
