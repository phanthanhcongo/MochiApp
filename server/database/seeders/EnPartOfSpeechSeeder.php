<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnPartOfSpeech;

class EnPartOfSpeechSeeder extends Seeder
{
    public function run(): void
    {
        EnPartOfSpeech::factory()->count(50)->create();
    }
}
