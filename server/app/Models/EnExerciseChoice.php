<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnExerciseChoice extends Model
{
    use HasFactory;

    protected $table = 'en_exercise_choices';

    protected $fillable = [
        'exercise_id',
        'content',
        'is_correct',
    ];

    public function exercise()
    {
        return $this->belongsTo(EnExampleExercise::class, 'exercise_id');
    }
}

