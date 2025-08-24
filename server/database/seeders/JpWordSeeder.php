<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JpWord;
use App\Models\User;

class JpWordSeeder extends Seeder
{
    public function run(): void
    {
        User::where('role', 'user')->each(function ($user) {
            JpWord::factory()->count(500)->create([
                'user_id' => $user->id
            ]);
        });
    }
}
