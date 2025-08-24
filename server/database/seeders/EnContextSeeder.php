<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnContext;

class EnContextSeeder extends Seeder
{
    public function run(): void
    {
        EnContext::factory()->count(50)->create();
    }
}
