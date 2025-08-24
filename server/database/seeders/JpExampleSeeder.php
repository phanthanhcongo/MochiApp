<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpWord;
use App\Models\JpExample;

class JpExampleSeeder extends Seeder
{
    public function run(): void
    {
        JpWord::all()->each(function ($word) {
            JpExample::factory()->count(2)->create([
                'jp_word_id' => $word->id
            ]);
        });
    }
}
