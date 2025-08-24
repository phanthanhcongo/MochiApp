<?php

namespace Database\Factories;

use App\Models\JpHanViet;
use App\Models\JpWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpHanVietFactory extends Factory
{
    protected $model = JpHanViet::class;

    public function definition(): array
    {
        return [
            'jp_word_id' => JpWord::inRandomOrder()->value('id') ?? JpWord::factory(),
            'han_viet' => $this->faker->word(),
            'explanation' => $this->faker->sentence(10),
        ];
    }
}
