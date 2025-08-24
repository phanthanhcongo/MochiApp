<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnContext extends Model
{
    use HasFactory;

    /** Tên bảng tương ứng trong DB */
    protected $table = 'en_contexts';

    protected $fillable = [
        'en_word_id',
        'context_vi',
    ];

    public function word()
    {
        return $this->belongsTo(EnWord::class, 'en_word_id');
    }
}
