<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnExampleExercise;

class EnExampleExerciseSeeder extends Seeder
{
    public function run(): void
    {
        EnExampleExercise::factory()->count(50)->create();
    }
}
