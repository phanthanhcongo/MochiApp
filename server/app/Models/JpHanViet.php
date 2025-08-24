<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpHanViet extends Model
{
    use HasFactory;

    protected $table = 'jp_hanviet';

    protected $fillable = [
        'jp_word_id',
        'han_viet',
        'explanation',
    ];

    public function jpWord()
    {
        return $this->belongsTo(JpWord::class);
    }
}
