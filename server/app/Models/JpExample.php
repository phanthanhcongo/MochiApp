<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpExample extends Model
{
    use HasFactory;

    protected $table = 'jp_examples';

    protected $fillable = [
        'jp_word_id',
        'sentence_jp',
        'sentence_hira',
        'sentence_romaji',
        'sentence_vi',
    ];

    public function jpWord()
    {
        return $this->belongsTo(JpWord::class);
    }
    public function exercises()
{
    return $this->hasMany(JpExampleExercise::class, 'example_id');
}

}
