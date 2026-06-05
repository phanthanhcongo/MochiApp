<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPassage extends Model
{
    use HasFactory;

    protected $table = 'user_passages';

    protected $fillable = [
        'user_id',
        'title',
        'passage',
        'translation',
        'language',
    ];

    /**
     * Get the user that owns the passage.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
