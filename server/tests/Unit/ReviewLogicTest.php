<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the review logic (level up/down, streak, lapses).
 * Tests the algorithm independently without database.
 */
class ReviewLogicTest extends TestCase
{
    /**
     * Simulate the review logic for a single word
     */
    private function processReview(
        int $currentLevel,
        int $currentStreak,
        int $currentLapses,
        bool $firstFailed
    ): array {
        if ($firstFailed) {
            // Wrong answer: level -1, streak reset, lapses +1
            $newLevel = max(1, $currentLevel - 1);
            $newStreak = 0;
            $newLapses = $currentLapses + 1;
        } else {
            // Correct answer: level +1, streak +1, lapses may decay
            $newLevel = min(7, $currentLevel + 1);
            $newStreak = $currentStreak + 1;
            $newLapses = $currentLapses;

            // Decay lapses every 3 streaks
            if ($newStreak > 0 && $newStreak % 3 == 0) {
                $newLapses = max(0, $newLapses - 1);
            }
        }

        return [
            'level' => $newLevel,
            'streak' => $newStreak,
            'lapses' => $newLapses,
        ];
    }

    // ====== Correct Answer Tests ======

    public function test_correct_answer_increases_level(): void
    {
        $result = $this->processReview(1, 0, 0, false);
        $this->assertEquals(2, $result['level']);
    }

    public function test_correct_answer_increases_streak(): void
    {
        $result = $this->processReview(1, 2, 0, false);
        $this->assertEquals(3, $result['streak']);
    }

    public function test_level_capped_at_7(): void
    {
        $result = $this->processReview(7, 0, 0, false);
        $this->assertEquals(7, $result['level']);
    }

    public function test_lapses_decay_at_streak_3(): void
    {
        // streak goes from 2 → 3 (divisible by 3) → lapses decay
        $result = $this->processReview(3, 2, 5, false);
        $this->assertEquals(3, $result['streak']);
        $this->assertEquals(4, $result['lapses']); // 5 - 1 = 4
    }

    public function test_lapses_decay_at_streak_6(): void
    {
        $result = $this->processReview(3, 5, 3, false);
        $this->assertEquals(6, $result['streak']);
        $this->assertEquals(2, $result['lapses']); // 3 - 1 = 2
    }

    public function test_lapses_decay_at_streak_9(): void
    {
        $result = $this->processReview(3, 8, 1, false);
        $this->assertEquals(9, $result['streak']);
        $this->assertEquals(0, $result['lapses']); // 1 - 1 = 0
    }

    public function test_no_lapses_decay_at_streak_4(): void
    {
        // 4 is not divisible by 3
        $result = $this->processReview(3, 3, 5, false);
        $this->assertEquals(4, $result['streak']);
        $this->assertEquals(5, $result['lapses']); // unchanged
    }

    public function test_lapses_cannot_go_below_zero(): void
    {
        $result = $this->processReview(3, 2, 0, false);
        $this->assertEquals(3, $result['streak']);
        $this->assertEquals(0, $result['lapses']); // max(0, 0-1) = 0
    }

    // ====== Wrong Answer Tests ======

    public function test_wrong_answer_decreases_level(): void
    {
        $result = $this->processReview(4, 5, 0, true);
        $this->assertEquals(3, $result['level']);
    }

    public function test_wrong_answer_resets_streak(): void
    {
        $result = $this->processReview(4, 5, 0, true);
        $this->assertEquals(0, $result['streak']);
    }

    public function test_wrong_answer_increases_lapses(): void
    {
        $result = $this->processReview(4, 5, 2, true);
        $this->assertEquals(3, $result['lapses']);
    }

    public function test_level_cannot_go_below_1(): void
    {
        $result = $this->processReview(1, 0, 0, true);
        $this->assertEquals(1, $result['level']);
    }

    public function test_wrong_at_level_5_drops_to_4(): void
    {
        // After unification: level 5 → 4 (was 5→4 in old JP, now unified)
        $result = $this->processReview(5, 3, 0, true);
        $this->assertEquals(4, $result['level']);
    }

    public function test_wrong_at_level_7_drops_to_6(): void
    {
        // After unification: level 7 → 6 (was 7→4 in old JP, now unified)
        $result = $this->processReview(7, 10, 0, true);
        $this->assertEquals(6, $result['level']);
    }

    // ====== Sequence Tests ======

    public function test_full_correct_sequence_level_1_to_7(): void
    {
        $level = 1;
        $streak = 0;
        $lapses = 0;

        for ($i = 0; $i < 6; $i++) {
            $result = $this->processReview($level, $streak, $lapses, false);
            $level = $result['level'];
            $streak = $result['streak'];
            $lapses = $result['lapses'];
        }

        $this->assertEquals(7, $level);
        $this->assertEquals(6, $streak);
    }

    public function test_wrong_then_correct_recovery(): void
    {
        // Start at level 4, streak 5
        $result = $this->processReview(4, 5, 0, true);
        $this->assertEquals(3, $result['level']);
        $this->assertEquals(0, $result['streak']);
        $this->assertEquals(1, $result['lapses']);

        // Correct answer
        $result = $this->processReview(
            $result['level'], $result['streak'], $result['lapses'], false
        );
        $this->assertEquals(4, $result['level']);
        $this->assertEquals(1, $result['streak']);
        $this->assertEquals(1, $result['lapses']); // not yet at streak 3
    }
}
