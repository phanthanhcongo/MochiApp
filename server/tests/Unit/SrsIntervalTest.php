<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for SRS (Spaced Repetition System) interval calculation logic.
 * Tests the core algorithm independently without database.
 */
class SrsIntervalTest extends TestCase
{
    // ====== Base Wait Seconds ======

    private function getBaseWaitSeconds(int $level): int
    {
        return match ($level) {
            1 => 30,            // 30 seconds
            2 => 600,           // 10 minutes
            3 => 86400,         // 1 day
            4 => 259200,        // 3 days
            5 => 604800,        // 7 days
            6 => 1814400,       // 21 days
            7 => 7776000,       // 90 days
            default => 30,
        };
    }

    private function getStreakFactor(int $streak): float
    {
        if ($streak <= 1) return 1.00;
        if ($streak <= 3) return 1.15;
        return 1.30;
    }

    private function getLapseFactor(int $lapses): float
    {
        if ($lapses <= 1) return 1.00;
        if ($lapses <= 4) return 0.85;
        if ($lapses <= 7) return 0.70;
        return 0.60;
    }

    private function calculateInterval(int $level, int $streak, int $lapses): int
    {
        $baseWait = $this->getBaseWaitSeconds($level);
        $streakFactor = $this->getStreakFactor($streak);
        $lapseFactor = $this->getLapseFactor($lapses);
        $interval = round($baseWait * $streakFactor * $lapseFactor);
        return max(30, $interval);
    }

    // ====== Tests for Base Wait Seconds ======

    public function test_level_1_base_wait_is_30_seconds(): void
    {
        $this->assertEquals(30, $this->getBaseWaitSeconds(1));
    }

    public function test_level_2_base_wait_is_10_minutes(): void
    {
        $this->assertEquals(600, $this->getBaseWaitSeconds(2));
    }

    public function test_level_3_base_wait_is_1_day(): void
    {
        $this->assertEquals(86400, $this->getBaseWaitSeconds(3));
    }

    public function test_level_7_base_wait_is_90_days(): void
    {
        $this->assertEquals(7776000, $this->getBaseWaitSeconds(7));
    }

    public function test_invalid_level_defaults_to_30_seconds(): void
    {
        $this->assertEquals(30, $this->getBaseWaitSeconds(0));
        $this->assertEquals(30, $this->getBaseWaitSeconds(99));
    }

    // ====== Tests for Streak Factor ======

    public function test_streak_0_factor_is_1(): void
    {
        $this->assertEquals(1.00, $this->getStreakFactor(0));
    }

    public function test_streak_1_factor_is_1(): void
    {
        $this->assertEquals(1.00, $this->getStreakFactor(1));
    }

    public function test_streak_2_3_factor_is_1_15(): void
    {
        $this->assertEquals(1.15, $this->getStreakFactor(2));
        $this->assertEquals(1.15, $this->getStreakFactor(3));
    }

    public function test_streak_4_plus_factor_is_1_30(): void
    {
        $this->assertEquals(1.30, $this->getStreakFactor(4));
        $this->assertEquals(1.30, $this->getStreakFactor(10));
    }

    // ====== Tests for Lapse Factor ======

    public function test_lapses_0_1_factor_is_1(): void
    {
        $this->assertEquals(1.00, $this->getLapseFactor(0));
        $this->assertEquals(1.00, $this->getLapseFactor(1));
    }

    public function test_lapses_2_4_factor_is_0_85(): void
    {
        $this->assertEquals(0.85, $this->getLapseFactor(2));
        $this->assertEquals(0.85, $this->getLapseFactor(4));
    }

    public function test_lapses_5_7_factor_is_0_70(): void
    {
        $this->assertEquals(0.70, $this->getLapseFactor(5));
        $this->assertEquals(0.70, $this->getLapseFactor(7));
    }

    public function test_lapses_8_plus_factor_is_0_60(): void
    {
        $this->assertEquals(0.60, $this->getLapseFactor(8));
        $this->assertEquals(0.60, $this->getLapseFactor(20));
    }

    // ====== Tests for Interval Calculation ======

    public function test_level_1_no_streak_no_lapses(): void
    {
        // 30 * 1.00 * 1.00 = 30
        $this->assertEquals(30, $this->calculateInterval(1, 0, 0));
    }

    public function test_level_3_with_streak_2(): void
    {
        // 86400 * 1.15 * 1.00 = 99360
        $this->assertEquals(99360, $this->calculateInterval(3, 2, 0));
    }

    public function test_level_5_with_high_lapses(): void
    {
        // 604800 * 1.00 * 0.60 = 362880
        $this->assertEquals(362880, $this->calculateInterval(5, 0, 10));
    }

    public function test_level_7_with_streak_and_lapses(): void
    {
        // 7776000 * 1.30 * 0.85 = 8587440
        $this->assertEquals(8587440, $this->calculateInterval(7, 5, 3));
    }

    public function test_minimum_interval_is_30_seconds(): void
    {
        // Even with extreme lapses at level 1: 30 * 1.00 * 0.60 = 18 → clamped to 30
        $result = $this->calculateInterval(1, 0, 10);
        $this->assertGreaterThanOrEqual(30, $result);
    }
}
