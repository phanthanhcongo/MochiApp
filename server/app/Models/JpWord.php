<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpWord extends Model
{
    use HasFactory;

    protected $table = 'jp_words';
protected $casts = [
    'next_review_at' => 'datetime',
      'is_grammar' => 'boolean',
        'is_active' => 'boolean',
];
    protected $fillable = [
        'user_id',
        'kanji',
        'reading_hiragana',
        'reading_romaji',
        'meaning_vi',
        'jlpt_level',
        'level',
        'last_reviewed_at',
        'next_review_at',
        'audio_url',
        'is_grammar',
        'is_active',
        'streak',
        'lapses',
        'last_quiz_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function examples()
{
    return $this->hasMany(JpExample::class);
}
public function contexts()
{
    return $this->hasMany(JpContext::class);
}
public function hanviet()
{
    return $this->hasOne(JpHanViet::class);
}
    public function strokes()
    {
        return $this->hasOne(JpStroke::class);
    }
public function jpDailyLogs()
{
    return $this->hasMany(JpDailyLog::class);
}


}
