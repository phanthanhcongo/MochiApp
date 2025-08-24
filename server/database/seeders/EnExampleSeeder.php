<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnExample;

class EnExampleSeeder extends Seeder
{
    public function run(): void
    {
        EnExample::factory()->count(50)->create();
    }
}
