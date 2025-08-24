<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;   // <-- thêm

class User extends Authenticatable
{
    use HasFactory, Notifiable;
    use HasApiTokens;    // <-- thêm HasApiTokens

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'learning_language', // Thêm trường ngôn ngữ đang học
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];
}
