<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnExerciseChoice;

class EnExerciseChoiceSeeder extends Seeder
{
    public function run(): void
    {
        EnExerciseChoice::factory()->count(200)->create();
    }
}
