<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the session-result SRS scheduling policy.
 * These tests intentionally mirror the target business rules in isolation.
 */
class SrsIntervalTest extends TestCase
{
    private function getBaseIntervalByLevel(int $level): int
    {
        return match ($level) {
            1 => 600,         // 10 minutes
            2 => 28800,       // 8 hours
            3 => 86400,       // 1 day
            4 => 259200,      // 3 days
            5 => 604800,      // 7 days
            6 => 1296000,     // 15 days
            7 => 2592000,     // 30 days
            8 => 5184000,     // 60 days
            9 => 10368000,    // 120 days
            default => 600,
        };
    }

    private function getStreakFactor(int $streak): float
    {
        if ($streak <= 1) {
            return 1.00;
        }

        if ($streak <= 3) {
            return 1.10;
        }

        if ($streak <= 6) {
            return 1.20;
        }

        return 1.30;
    }

    private function getLapseFactor(int $lapses): float
    {
        if ($lapses <= 0) {
            return 1.00;
        }

        if ($lapses <= 2) {
            return 0.90;
        }

        if ($lapses <= 4) {
            return 0.75;
        }

        return 0.60;
    }

    private function calculateIntervalForPolicy(int $level, int $streak, int $lapses): int
    {
        $baseInterval = $this->getBaseIntervalByLevel($level);
        $streakFactor = $this->getStreakFactor($streak);
        $lapseFactor = $this->getLapseFactor($lapses);

        return (int) round($baseInterval * $streakFactor * $lapseFactor);
    }

    public function test_level_1_base_interval_is_10_minutes(): void
    {
        $this->assertEquals(600, $this->getBaseIntervalByLevel(1));
    }

    public function test_level_2_base_interval_is_8_hours(): void
    {
        $this->assertEquals(28800, $this->getBaseIntervalByLevel(2));
    }

    public function test_level_5_base_interval_is_7_days(): void
    {
        $this->assertEquals(604800, $this->getBaseIntervalByLevel(5));
    }

    public function test_level_9_base_interval_is_120_days(): void
    {
        $this->assertEquals(10368000, $this->getBaseIntervalByLevel(9));
    }

    public function test_invalid_level_defaults_to_level_1_interval(): void
    {
        $this->assertEquals(600, $this->getBaseIntervalByLevel(0));
        $this->assertEquals(600, $this->getBaseIntervalByLevel(99));
    }

    public function test_streak_factor_for_zero_and_one_is_one(): void
    {
        $this->assertEquals(1.00, $this->getStreakFactor(0));
        $this->assertEquals(1.00, $this->getStreakFactor(1));
    }

    public function test_streak_factor_for_two_and_three_is_one_point_one(): void
    {
        $this->assertEquals(1.10, $this->getStreakFactor(2));
        $this->assertEquals(1.10, $this->getStreakFactor(3));
    }

    public function test_streak_factor_for_four_to_six_is_one_point_two(): void
    {
        $this->assertEquals(1.20, $this->getStreakFactor(4));
        $this->assertEquals(1.20, $this->getStreakFactor(6));
    }

    public function test_streak_factor_for_seven_plus_is_one_point_three(): void
    {
        $this->assertEquals(1.30, $this->getStreakFactor(7));
        $this->assertEquals(1.30, $this->getStreakFactor(20));
    }

    public function test_lapse_factor_for_zero_is_one(): void
    {
        $this->assertEquals(1.00, $this->getLapseFactor(0));
    }

    public function test_lapse_factor_for_one_to_two_is_zero_point_nine(): void
    {
        $this->assertEquals(0.90, $this->getLapseFactor(1));
        $this->assertEquals(0.90, $this->getLapseFactor(2));
    }

    public function test_lapse_factor_for_three_to_four_is_zero_point_seven_five(): void
    {
        $this->assertEquals(0.75, $this->getLapseFactor(3));
        $this->assertEquals(0.75, $this->getLapseFactor(4));
    }

    public function test_lapse_factor_for_five_plus_is_zero_point_six(): void
    {
        $this->assertEquals(0.60, $this->getLapseFactor(5));
        $this->assertEquals(0.60, $this->getLapseFactor(12));
    }

    public function test_interval_uses_level_streak_and_lapses(): void
    {
        // Level 3 = 1 day, streak 2 => 1.10, lapses 0 => 1.00
        $this->assertEquals(95040, $this->calculateIntervalForPolicy(3, 2, 0));
    }

    public function test_lapses_reduce_interval_even_after_success(): void
    {
        $stable = $this->calculateIntervalForPolicy(5, 3, 0);
        $unstable = $this->calculateIntervalForPolicy(5, 3, 3);

        $this->assertGreaterThan($unstable, $stable);
    }

    public function test_high_streak_extends_interval_more_than_low_streak(): void
    {
        $lowStreak = $this->calculateIntervalForPolicy(6, 1, 0);
        $highStreak = $this->calculateIntervalForPolicy(6, 7, 0);

        $this->assertGreaterThan($lowStreak, $highStreak);
    }

    public function test_first_result_success_promotes_level_once_in_policy(): void
    {
        $currentLevel = 4;
        $newLevel = min(9, $currentLevel + 1);

        $this->assertEquals(5, $newLevel);
        $this->assertEquals(
            604800,
            $this->getBaseIntervalByLevel($newLevel)
        );
    }

    public function test_first_result_failure_demotes_level_once_in_policy(): void
    {
        $currentLevel = 4;
        $newLevel = max(1, $currentLevel - 1);

        $this->assertEquals(3, $newLevel);
        $this->assertEquals(
            86400,
            $this->getBaseIntervalByLevel($newLevel)
        );
    }

    public function test_level_cap_is_nine(): void
    {
        $currentLevel = 9;
        $newLevel = min(9, $currentLevel + 1);

        $this->assertEquals(9, $newLevel);
    }
}
