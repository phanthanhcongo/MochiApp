<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnDailyLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reviewed_at',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
