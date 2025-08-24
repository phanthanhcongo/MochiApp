<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpExampleExercise extends Model
{
    use HasFactory;

    protected $table = 'jp_example_exercises';

    protected $fillable = [
        'example_id',
        'question_type',
        'question_text',
        'blank_position',
        'answer_explanation',
    ];

    public function example()
    {
        return $this->belongsTo(JpExample::class, 'example_id');
    }

    public function choices()
    {
        return $this->hasMany(JpExerciseChoice::class, 'exercise_id');
    }
}
