<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JpContext extends Model
{
    use HasFactory;

    protected $table = 'jp_contexts';

    protected $fillable = [
        'jp_word_id',
        'context_vi',
    ];

    public function jpWord()
    {
        return $this->belongsTo(JpWord::class);
    }
}
