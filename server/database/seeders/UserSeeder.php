<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Tài khoản admin
        User::create([
            'name' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('123123'),
            'role' => 'admin',
            'learning_language' => 'en', // Thêm ngôn ngữ đang học
        ]);

        // Tài khoản người dùng thường
        User::create([
            'name' => 'user123',
            'email' => 'user123@example.com',
            'password' => Hash::make('123123'),
            'role' => 'user',
            'learning_language' => 'en', // Thêm ngôn ngữ đang học
        ]);
    }
}
