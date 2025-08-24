<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpHanViet;
use App\Models\JpWord;

class JpHanVietSeeder extends Seeder
{
    public function run(): void
    {
        JpWord::all()->each(function ($word) {
            JpHanViet::factory()->create([
                'jp_word_id' => $word->id,
            ]);
        });
    }
}
