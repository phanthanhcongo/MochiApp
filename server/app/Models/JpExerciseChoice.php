<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpExerciseChoice extends Model
{
    use HasFactory;

    protected $table = 'jp_exercise_choices';

    protected $fillable = [
        'exercise_id',
        'content',
        'is_correct',
    ];

    public function exercise()
    {
        return $this->belongsTo(JpExampleExercise::class, 'exercise_id');
    }
}
