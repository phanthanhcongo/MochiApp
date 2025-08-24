<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnExample extends Model
{
    use HasFactory;

    protected $fillable = [
        'en_word_id',
        'sentence_en',
        'sentence_vi',
    ];

    public function word()
    {
        return $this->belongsTo(EnWord::class, 'en_word_id');
    }
      // Example có nhiều bài tập liên quan
    public function exercises()
    {
        return $this->hasMany(EnExampleExercise::class, 'example_id');
    }
}
