<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnPronunciation;

class EnPronunciationSeeder extends Seeder
{
    public function run(): void
    {
        EnPronunciation::factory()->count(50)->create();
    }
}
