<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpStroke;
use App\Models\JpWord;

class JpStrokeSeeder extends Seeder
{
    public function run(): void
    {
        JpWord::all()->each(function ($word) {
            JpStroke::factory()->create([
                'jp_word_id' => $word->id,
            ]);
        });
    }
}
