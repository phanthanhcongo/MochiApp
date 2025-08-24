<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EnWord extends Model
{
    use HasFactory;

     protected $fillable = [
        'user_id',
        'word',
        'ipa',
        'meaning_vi',
        'cefr_level',
        'level',
        'last_reviewed_at',
        'next_review_at',
        'exampleEn',
        'exampleVn',
    ];

    // Quan hệ với bảng con
     public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function examples() {
        return $this->hasMany(EnExample::class);
    }

    public function contexts() {
        return $this->hasMany(EnContext::class);
    }




}
