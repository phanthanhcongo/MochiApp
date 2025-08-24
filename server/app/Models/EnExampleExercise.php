<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnExampleExercise extends Model
{
    use HasFactory;

    protected $table = 'en_example_exercises';

    protected $fillable = [
        'example_id',
        'question_type',
        'question_text',
        'blank_position',
        'answer_explanation',
    ];

    public function example()
    {
        return $this->belongsTo(EnExample::class, 'example_id');
    }

    public function choices()
    {
        return $this->hasMany(EnExerciseChoice::class, 'exercise_id');
    }
}
