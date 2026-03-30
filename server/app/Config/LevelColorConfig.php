<?php

namespace App\Config;

class LevelColorConfig
{
    /**
     * Tailwind CSS color classes for each SRS level (1-7).
     * Used by both JapaneseService and EnglishService for stats responses.
     */
    public const COLORS = [
        1 => 'bg-red-400',
        2 => 'bg-fuchsia-300',
        3 => 'bg-yellow-400',
        4 => 'bg-green-400',
        5 => 'bg-sky-400',
        6 => 'bg-indigo-500',
        7 => 'bg-purple-600',
    ];

    public const DEFAULT_COLOR = 'bg-gray-400';

    /**
     * Get color for a given level
     */
    public static function getColor(int $level): string
    {
        return self::COLORS[$level] ?? self::DEFAULT_COLOR;
    }
}
