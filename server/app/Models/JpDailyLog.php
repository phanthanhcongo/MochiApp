<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JpDailyLog extends Model
{
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
