<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\EnWord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Carbon;

class ReviewFlowTest extends TestCase
{
    use RefreshDatabase;
    private $user;
    private $word;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user
        $this->user = User::factory()->create();

        // Create an English word for this user
        $this->word = EnWord::create([
            'user_id' => $this->user->id,
            'word' => 'hello',
            'ipa' => 'həˈləʊ',
            'meaning_vi' => 'xin chào',
            'level' => 4,
            'streak' => 2,
            'lapses' => 1,
            'last_reviewed_at' => Carbon::now()->subDays(5),
            'next_review_at' => Carbon::now()->subDays(2),
        ]);
    }

    public function test_submit_one_reviewed_word_updates_srs_correctly(): void
    {
        Sanctum::actingAs($this->user);

        // Submit correct attempt (firstFailed = false)
        // Level 4 -> Level 5
        // Streak 2 -> Streak 3
        // Lapses 1 -> Lapses 0 (decayed because streak 3 is divisible by 3)
        // baseInterval for Level 5 = 604800 seconds (7 days)
        // streakFactor for streak 3 = 1.10
        // lapseFactor for lapses 0 = 1.00
        // quizFactor for voicePractice = 0.95
        // Expected interval = round(604800 * 1.10 * 1.00 * 0.95) = 632016 seconds

        $response = $this->postJson('/api/en/practice/reviewed-words', [
            'reviewedWords' => [
                [
                    'word' => ['id' => $this->word->id],
                    'firstFailed' => false,
                    'reviewedAt' => Carbon::now()->toIso8601String(),
                    'quizType' => 'voicePractice',
                ]
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['updated' => 1]);

        $this->word->refresh();

        $this->assertEquals(5, $this->word->level);
        $this->assertEquals(3, $this->word->streak);
        $this->assertEquals(0, $this->word->lapses); // 1 decayed to 0

        // Check if next_review_at matches expected interval within a tolerance of 5 seconds
        $expectedInterval = (int) round(604800 * 1.10 * 1.00 * 0.95);
        $actualInterval = abs(Carbon::parse($this->word->next_review_at)->timestamp - Carbon::parse($this->word->last_reviewed_at)->timestamp);
        $this->assertEqualsWithDelta($expectedInterval, $actualInterval, 5);
    }

    public function test_submit_failed_word_demotes_correctly(): void
    {
        Sanctum::actingAs($this->user);

        // Submit failed attempt (firstFailed = true)
        // Level 4 -> Level 3
        // Streak 2 -> Streak 0
        // Lapses 1 -> Lapses 2
        // baseInterval for Level 3 = 86400 seconds (1 day)
        // streakFactor for streak 0 = 1.00
        // lapseFactor for lapses 2 = 0.90
        // quizFactor for multiple = 0.90
        // Expected interval = round(86400 * 1.00 * 0.90 * 0.90) = 69984 seconds

        $response = $this->postJson('/api/en/practice/reviewed-words', [
            'reviewedWords' => [
                [
                    'word' => ['id' => $this->word->id],
                    'firstFailed' => true,
                    'reviewedAt' => Carbon::now()->toIso8601String(),
                    'quizType' => 'multiple',
                ]
            ]
        ]);

        $response->assertStatus(200);
        $this->word->refresh();

        $this->assertEquals(3, $this->word->level);
        $this->assertEquals(0, $this->word->streak);
        $this->assertEquals(2, $this->word->lapses);

        $expectedInterval = (int) round(86400 * 1.00 * 0.90 * 0.90);
        $actualInterval = abs(Carbon::parse($this->word->next_review_at)->timestamp - Carbon::parse($this->word->last_reviewed_at)->timestamp);
        $this->assertEqualsWithDelta($expectedInterval, $actualInterval, 5);
    }

    public function test_submit_level_nine_does_not_overflow(): void
    {
        Sanctum::actingAs($this->user);

        // Update word to level 9
        $this->word->update(['level' => 9, 'streak' => 8, 'lapses' => 0]);

        $response = $this->postJson('/api/en/practice/reviewed-words', [
            'reviewedWords' => [
                [
                    'word' => ['id' => $this->word->id],
                    'firstFailed' => false,
                    'reviewedAt' => Carbon::now()->toIso8601String(),
                    'quizType' => 'multipleSentence', // quizFactor = 1.00
                ]
            ]
        ]);

        $response->assertStatus(200);
        $this->word->refresh();

        $this->assertEquals(9, $this->word->level); // Capped at 9
        $this->assertEquals(9, $this->word->streak);
    }
}
