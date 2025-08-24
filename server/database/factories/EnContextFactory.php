<?php

namespace Database\Factories;

use App\Models\EnContext;
use App\Models\EnWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnContextFactory extends Factory
{
    protected $model = EnContext::class;

    public function definition(): array
    {
        return [
            'en_word_id' => EnWord::factory(),
            'context_vi' => $this->faker->sentence(8),
        ];
    }
}
