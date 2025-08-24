<?php
namespace Database\Factories;

use App\Models\JpContext;
use App\Models\JpWord;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpContextFactory extends Factory
{
    protected $model = JpContext::class;

    public function definition(): array
    {
        return [
            'jp_word_id' => JpWord::inRandomOrder()->value('id') ?? JpWord::factory(),
            'context_vi' => $this->faker->sentence(12),
        ];
    }
}
