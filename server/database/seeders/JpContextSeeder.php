<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpWord;
use App\Models\JpContext;

class JpContextSeeder extends Seeder
{
    public function run(): void
    {
        JpWord::all()->each(function ($word) {
            JpContext::factory()->count(2)->create([
                'jp_word_id' => $word->id
            ]);
        });
    }
}
