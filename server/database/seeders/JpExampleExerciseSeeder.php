<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpExampleExercise;
use App\Models\JpExample;

class JpExampleExerciseSeeder extends Seeder
{
    public function run(): void
    {
        JpExample::all()->each(function ($example) {
            JpExampleExercise::factory()->create([
                'example_id' => $example->id,
            ]);
        });
    }
}
