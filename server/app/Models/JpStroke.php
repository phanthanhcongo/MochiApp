<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpStroke extends Model
{
    use HasFactory;

    protected $table = 'jp_strokes';

    protected $fillable = [
        'jp_word_id',
        'stroke_url',
    ];

    public function jpWord()
    {
        return $this->belongsTo(JpWord::class);
    }
}
