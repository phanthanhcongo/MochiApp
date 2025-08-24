<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EnWord;
use App\Models\User;

class EnWordSeeder extends Seeder
{
    public function run(): void
    {
        User::where('role', 'user')->get()->each(function ($user) {
            EnWord::factory()
                ->count(20)
                ->create([
                    'user_id' => $user->id,
                ]);
        });
    }
}
