<?php

namespace Database\Factories;

use App\Models\JpWord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class JpWordFactory extends Factory
{
    protected $model = JpWord::class;

    public function definition(): array
{
    $level = $this->faker->numberBetween(1, 5);
    $now = now();

    switch ($level) {
        case 1:
            $lastReviewedAt = $this->faker->dateTimeBetween('-8 hours', 'now');
            $nextReviewAt = (clone $lastReviewedAt)->modify('+1 hour');
            break;
        case 2:
            $lastReviewedAt = $this->faker->dateTimeBetween('-1 day', '-3 hours');
            $nextReviewAt = (clone $lastReviewedAt)->modify('+3 hours');
            break;
        case 3:
            $lastReviewedAt = $this->faker->dateTimeBetween('-2 days', '-1 day');
            $nextReviewAt = (clone $lastReviewedAt)->modify('+1 day');
            break;
        case 4:
            $lastReviewedAt = $this->faker->dateTimeBetween('-5 days', '-3 days');
            $nextReviewAt = (clone $lastReviewedAt)->modify('+3 days');
            break;
        case 5:
        default:
            $lastReviewedAt = $this->faker->dateTimeBetween('-8 days', '-5 days');
            $nextReviewAt = (clone $lastReviewedAt)->modify('+7 days');
            break;
    }

    return [
        'user_id' => User::where('role', 'user')->inRandomOrder()->first()?->id ?? User::factory(),
        'kanji' => $this->faker->lexify('漢?字'),
        'reading_hiragana' => $this->faker->lexify('????'),
        'reading_romaji' => $this->faker->word(),
        'meaning_vi' => $this->faker->sentence(),
        'jlpt_level' => $this->faker->randomElement(['N5', 'N4', 'N3', 'N2', 'N1']),
        'level' => $level,
        'last_reviewed_at' => $lastReviewedAt,
        'next_review_at' => $nextReviewAt,
        'audio_url' => $this->faker->optional()->url(),
    ];
}

}
