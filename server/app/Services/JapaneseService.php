<?php

namespace App\Services;

use App\Models\JpWord;
use App\Models\JpHanviet;
use App\Models\JpStroke;
use App\Models\JpContext;
use App\Models\JpExample;
use App\Models\JpExampleExercise;
use App\Models\JpExerciseChoice;
use App\Models\JpDailyLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Collection;

class JapaneseService
{
    /**
     * Import vocabulary from array of items
     */
    public function importVocabulary(array $items, int $userId): array
    {
        $committed = [];
        $duplicates = [];
        $seenInBatch = [];

        DB::transaction(function () use ($items, $userId, &$committed, &$duplicates, &$seenInBatch) {
            foreach ($items as $item) {
                $kanji = trim($item['kanji']);

                // Chống trùng trong cùng payload
                if (isset($seenInBatch[mb_strtolower($kanji)])) {
                    $duplicates[] = $kanji;
                    continue;
                }
                $seenInBatch[mb_strtolower($kanji)] = true;

                // Check trùng theo DB: (user_id, kanji)
                $exists = JpWord::where('user_id', $userId)
                    ->where('kanji', $kanji)
                    ->exists();

                if ($exists) {
                    $duplicates[] = $kanji;
                    continue;
                }

                // Insert JpWord
                $word = JpWord::create([
                    'user_id'          => $userId,
                    'kanji'            => $kanji,
                    'reading_hiragana' => $item['reading_hiragana'],
                    'reading_romaji'   => $item['reading_romaji'],
                    'meaning_vi'       => $item['meaning_vi'],
                    'jlpt_level'       => $item['jlpt_level'] ?? null,
                    'level'            => $item['level'] ?? 1,
                    'is_grammar'       => $item['is_grammar'] ?? '0',
                    'streak'           => 0,
                    'lapses'           => 0,
                    'last_reviewed_at' => Carbon::now()->subDays(3),
                    'next_review_at'   => Carbon::now()->subDays(2),
                    'audio_url'        => $item['audio_url'] ?? null,
                ]);

                // HanViet
                JpHanviet::create([
                    'jp_word_id'  => $word->id,
                    'han_viet'    => $item['han_viet'],
                    'explanation' => $item['explanation'],
                ]);

                // Stroke (optional)
                if (!empty($item['stroke_url'])) {
                    JpStroke::create([
                        'jp_word_id' => $word->id,
                        'stroke_url' => $item['stroke_url'],
                    ]);
                }

                // Contexts (optional)
                if (!empty($item['contexts']) && is_array($item['contexts'])) {
                    foreach ($item['contexts'] as $context) {
                        JpContext::create([
                            'jp_word_id'     => $word->id,
                            'context_vi'     => $context['context_vi'],
                            'highlight_line' => $context['highlight_line'] ?? '',
                            'context_jp'     => $context['context_jp'] ?? '',
                            'context_hira'   => $context['context_hira'] ?? '',
                            'context_romaji' => $context['context_romaji'] ?? '',
                        ]);
                    }
                }

                // Examples + quizzes (optional)
                if (!empty($item['examples']) && is_array($item['examples'])) {
                    foreach ($item['examples'] as $example) {
                        $ex = JpExample::create([
                            'jp_word_id'      => $word->id,
                            'sentence_jp'     => $example['sentence_jp'],
                            'sentence_hira'   => $example['sentence_hira'],
                            'sentence_romaji' => $example['sentence_romaji'],
                            'sentence_vi'     => $example['sentence_vi'],
                        ]);

                        if (!empty($item['quizzes']) && is_array($item['quizzes'])) {
                            foreach ($item['quizzes'] as $quiz) {
                                $exercise = JpExampleExercise::create([
                                    'example_id'         => $ex->id,
                                    'question_type'      => $quiz['question_type'],
                                    'question_text'      => $quiz['question_text'],
                                    'blank_position'     => $quiz['blank_position'] ?? null,
                                    'answer_explanation' => $quiz['answer_explanation'] ?? null,
                                ]);

                                if (!empty($quiz['choices']) && is_array($quiz['choices'])) {
                                    foreach ($quiz['choices'] as $choice) {
                                        JpExerciseChoice::create([
                                            'exercise_id' => $exercise->id,
                                            'content'     => $choice['content'],
                                            'is_correct'  => (bool) $choice['is_correct'],
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                }

                $committed[] = [
                    'word'   => $kanji,
                    'status' => 'commit',
                ];
            }
        }, 1);

        return [
            'committed'  => $committed,
            'duplicates' => array_values(array_unique($duplicates)),
        ];
    }

    /**
     * Add a new word
     */
    public function addWord(array $data, int $userId): JpWord
    {
        $now = Carbon::now();
        $level = (int)($data['level'] ?? 1);
        $streak = 0; // Default initial streak
        $lapses = 0; // Default initial lapses
        $intervalSeconds = $this->calculateInterval($level, $streak, $lapses);
        $nextReviewAt = $now->copy()->addSeconds($intervalSeconds);

        return DB::transaction(function () use ($data, $userId, $now, $nextReviewAt, $streak, $lapses) {
            $isGrammar = isset($data['is_grammar']) ? (int) $data['is_grammar'] : 0;
            $isActive = isset($data['is_active']) ? (int) $data['is_active'] : 1;

            // 1. jp_words + set lịch ôn
            $word = JpWord::create([
                'user_id'          => $userId,
                'kanji'            => $data['kanji'],
                'reading_hiragana' => $data['reading_hiragana'] ?? null,
                'reading_romaji'   => $data['reading_romaji'] ?? null,
                'meaning_vi'       => $data['meaning_vi'] ?? null,
                'jlpt_level'       => $data['jlpt_level'] ?? null,
                'level'            => $data['level'] ?? 1,
                'is_grammar'       => $isGrammar,
                'is_active'        => $isActive,
                'streak'           => $streak,
                'lapses'           => $lapses,
                'last_reviewed_at' => $now,
                'next_review_at'   => $nextReviewAt,
            ]);

            // 2. jp_hanviet
            if (!empty($data['han_viet']) || !empty($data['hanviet_explanation'])) {
                JpHanviet::create([
                    'jp_word_id'  => $word->id,
                    'han_viet'    => $data['han_viet'] ?? null,
                    'explanation' => $data['hanviet_explanation'] ?? null,
                ]);
            }

            // 3. jp_contexts
            if (!empty($data['context_vi'])) {
                JpContext::create([
                    'jp_word_id' => $word->id,
                    'context_vi' => $data['context_vi'],
                ]);
            }

            // 4. jp_examples
            if (!empty($data['sentence_jp']) || !empty($data['sentence_vi'])) {
                JpExample::create([
                    'jp_word_id'      => $word->id,
                    'sentence_jp'     => $data['sentence_jp'] ?? null,
                    'sentence_hira'   => $data['sentence_hira'] ?? null,
                    'sentence_romaji' => $data['sentence_romaji'] ?? null,
                    'sentence_vi'     => $data['sentence_vi'] ?? null,
                ]);
            }

            return $word;
        });
    }

    /**
     * Update a word
     */
    public function updateWord(int $id, array $data, int $userId): JpWord
    {
        $word = JpWord::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        return DB::transaction(function () use ($data, $word) {
            $updateWord = [];

            // Chỉ set các key có gửi lên
            foreach (['kanji', 'reading_hiragana', 'reading_romaji', 'meaning_vi', 'jlpt_level', 'is_grammar', 'is_active'] as $k) {
                if (array_key_exists($k, $data)) {
                    $updateWord[$k] = $data[$k];
                }
            }

            // Level: nếu có gửi, cập nhật và tính lại next_review_at
            if (array_key_exists('level', $data)) {
                $level = (int)($data['level'] ?? 1);
                $updateWord['level'] = $level;

                $now = Carbon::now();
                $currentStreak = max(0, (int) ($word->streak ?? 0));
                $currentLapses = max(0, (int) ($word->lapses ?? 0));
                $intervalSeconds = $this->calculateInterval($level, $currentStreak, $currentLapses);
                $updateWord['next_review_at'] = $now->copy()->addSeconds($intervalSeconds);
            }

            if (!empty($updateWord)) {
                $word->update($updateWord);
            }

            // jp_hanviet: upsert hoặc xóa khi rỗng hoàn toàn
            $hasHanvietKeys = array_key_exists('han_viet', $data) || array_key_exists('hanviet_explanation', $data);
            if ($hasHanvietKeys) {
                $hvVal = [
                    'han_viet'    => $data['han_viet'] ?? null,
                    'explanation' => $data['hanviet_explanation'] ?? null,
                ];
                $bothEmpty = empty($hvVal['han_viet']) && empty($hvVal['explanation']);

                $existingHv = JpHanviet::where('jp_word_id', $word->id)->first();
                if ($bothEmpty) {
                    if ($existingHv) $existingHv->delete();
                } else {
                    JpHanviet::updateOrCreate(
                        ['jp_word_id' => $word->id],
                        $hvVal
                    );
                }
            }

            // jp_contexts: 1 context đầu tiên
            if (array_key_exists('context_vi', $data)) {
                $ctxVal = trim((string)($data['context_vi'] ?? ''));
                $existingCtx = JpContext::where('jp_word_id', $word->id)->orderBy('id')->first();

                if ($ctxVal === '') {
                    if ($existingCtx) $existingCtx->delete();
                } else {
                    if ($existingCtx) {
                        $existingCtx->update(['context_vi' => $ctxVal]);
                    } else {
                        JpContext::create([
                            'jp_word_id' => $word->id,
                            'context_vi' => $ctxVal,
                        ]);
                    }
                }
            }

            // jp_examples: 1 example đầu tiên
            $hasExampleKeys = array_key_exists('sentence_jp', $data)
                || array_key_exists('sentence_romaji', $data)
                || array_key_exists('sentence_vi', $data)
                || array_key_exists('sentence_hira', $data);

            if ($hasExampleKeys) {
                $exPayload = [
                    'sentence_jp'     => $data['sentence_jp'] ?? null,
                    'sentence_romaji' => $data['sentence_romaji'] ?? null,
                    'sentence_vi'     => $data['sentence_vi'] ?? null,
                    'sentence_hira'   => $data['sentence_hira'] ?? null,
                ];
                $allEmpty = empty($exPayload['sentence_jp'])
                    && empty($exPayload['sentence_romaji'])
                    && empty($exPayload['sentence_vi'])
                    && empty($exPayload['sentence_hira']);

                $existingEx = JpExample::where('jp_word_id', $word->id)->orderBy('id')->first();

                if ($allEmpty) {
                    if ($existingEx) $existingEx->delete();
                } else {
                    if ($existingEx) {
                        $existingEx->update($exPayload);
                    } else {
                        JpExample::create(array_merge($exPayload, [
                            'jp_word_id' => $word->id,
                        ]));
                    }
                }
            }

            return $word->fresh();
        });
    }

    /**
     * Delete a word
     */
    public function deleteWord(int $id, int $userId): bool
    {
        $word = JpWord::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        return $word->delete();
    }

    /**
     * Get practice stats
     */
    public function getStats(int $userId, Carbon $now): array
    {
        // 1. Thống kê số từ theo cấp độ (chỉ lấy từ vựng)
        $reviewStats = JpWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', false)
            ->select('level', DB::raw('count(*) as count'))
            ->groupBy('level')
            ->orderBy('level')
            ->get()
            ->map(function ($item) {
                $colors = [
                    1 => 'bg-red-400',
                    2 => 'bg-fuchsia-300',
                    3 => 'bg-yellow-400',
                    4 => 'bg-green-400',
                    5 => 'bg-sky-400',
                    6 => 'bg-indigo-500',
                    7 => 'bg-purple-600',
                ];

                return [
                    'level' => $item->level,
                    'count' => $item->count,
                    'color' => $colors[$item->level] ?? 'bg-gray-400',
                ];
            });

        // 2. Tổng số từ
        $totalWords = JpWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', false)
            ->count();

        // 3. Danh sách từ cần ôn
        $wordsToReviewList = JpWord::with([
            'hanviet',
            'contexts',
            'examples'
        ])
            ->where('is_active', true)
            ->where('user_id', $userId)
            ->where('next_review_at', '<=', $now)
            ->where('is_grammar', false)
            ->orderBy('next_review_at')
            ->get();

        // 4. Thời gian đến lần ôn gần nhất
        $nearestReviewTime = JpWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', false)
            ->where('next_review_at', '>', $now)
            ->min('next_review_at');

        $nextReviewIn = $nearestReviewTime
            ? Carbon::parse($nearestReviewTime)->diff($now)->format('%H:%I:%S')
            : null;

        // 5. Tính streak
        $streak = $this->computeStreak($userId, $now);

        return [
            'reviewStats' => $reviewStats,
            'totalWords' => $totalWords,
            'wordsToReview' => $wordsToReviewList->count(),
            'reviewWords' => $wordsToReviewList,
            'streak' => $streak,
            'nextReviewIn' => $nextReviewIn,
        ];
    }

    /**
     * Get grammar stats
     */
    public function getStatsGrammar(int $userId, Carbon $now): array
    {
        // 1. Thống kê số "mẫu ngữ pháp" theo level
        $reviewStats = JpWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', true)
            ->select('level', DB::raw('count(*) as count'))
            ->groupBy('level')
            ->orderBy('level')
            ->get()
            ->map(function ($item) {
                $colors = [
                    1 => 'bg-red-400',
                    2 => 'bg-fuchsia-300',
                    3 => 'bg-yellow-400',
                    4 => 'bg-green-400',
                    5 => 'bg-sky-400',
                    6 => 'bg-indigo-500',
                    7 => 'bg-purple-600',
                ];

                return [
                    'level' => $item->level,
                    'count' => $item->count,
                    'color' => $colors[$item->level] ?? 'bg-gray-400',
                ];
            });

        // 2. Tổng số NGỮ PHÁP
        $totalGrammar = JpWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', true)
            ->count();

        // 3. Danh sách NGỮ PHÁP cần ôn
        $grammarToReviewList = JpWord::with([
            'hanviet',
            'contexts',
            'examples',
        ])
            ->where('is_active', true)
            ->where('is_grammar', true)
            ->where('user_id', $userId)
            ->where('next_review_at', '<=', $now)
            ->orderBy('next_review_at')
            ->get();

        // 4. Thời gian đến lần ôn NGỮ PHÁP gần nhất
        $nearestReviewTime = JpWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', true)
            ->where('next_review_at', '>', $now)
            ->min('next_review_at');

        $nextReviewIn = $nearestReviewTime
            ? Carbon::parse($nearestReviewTime)->diff($now)->format('%H:%I:%S')
            : null;

        // 5. Streak
        $streak = $this->computeStreak($userId, $now);

        return [
            'reviewStats'      => $reviewStats,
            'totalGrammar'     => $totalGrammar,
            'grammarToReview'  => $grammarToReviewList->count(),
            'reviewGrammar'    => $grammarToReviewList,
            'streak'           => $streak,
            'nextReviewIn'     => $nextReviewIn,
        ];
    }

    /**
     * Get all words
     */
    public function getAllWords(int $userId): Collection
    {
        return JpWord::with(['hanviet', 'contexts', 'examples'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Update reviewed words
     */
    public function updateReviewedWords(array $reviewedWords, int $userId): array
    {
        $tz = config('app.timezone', 'Asia/Bangkok');
        $anyUpdated = false;

        foreach ($reviewedWords as $log) {
            $wordId = data_get($log, 'word.id');
            if (!$wordId) {
                continue;
            }

            $jpWord = JpWord::where('id', $wordId)
                ->where('user_id', $userId)
                ->first();

            if (!$jpWord) {
                continue;
            }

            $firstFailed = filter_var(data_get($log, 'firstFailed'), FILTER_VALIDATE_BOOLEAN);

            $reviewedAtRaw = data_get($log, 'reviewedAt');
            try {
                $reviewedAt = $reviewedAtRaw ? Carbon::parse($reviewedAtRaw, $tz) : now($tz);
            } catch (\Throwable $e) {
                $reviewedAt = now($tz);
            }

            $currentLevel = max(1, (int) ($jpWord->level ?? 1));
            $currentStreak = max(0, (int) ($jpWord->streak ?? 0));
            $currentLapses = max(0, (int) ($jpWord->lapses ?? 0));

            if ($firstFailed) {
                // When wrong: increase lapses, reset streak to 0
                $newLevel = max(1, $currentLevel - 1);
                $newStreak = 0;
                $newLapses = $currentLapses + 1;
            } else {
                // When correct: increase streak, check for lapses decay
                $newLevel = min(7, $currentLevel + 1);
                $newStreak = $currentStreak + 1;
                $newLapses = $currentLapses;

                // Decay lapses when streak reaches 3, 6, 9, 12... (divisible by 3)
                if ($newStreak > 0 && $newStreak % 3 == 0) {
                    $newLapses = max(0, $newLapses - 1);
                }
            }

            // Calculate interval based on new values
            $intervalSeconds = $this->calculateInterval($newLevel, $newStreak, $newLapses);
            $nextReviewAt = $reviewedAt->copy()->addSeconds($intervalSeconds);

            $jpWord->update([
                'level' => $newLevel,
                'streak' => $newStreak,
                'lapses' => $newLapses,
                'last_reviewed_at' => $reviewedAt,
                'next_review_at' => $nextReviewAt,
            ]);

            $anyUpdated = true;
        }

        // Ghi daily log
        if ($anyUpdated) {
            DB::transaction(function () use ($userId, $tz) {
                $today = Carbon::today($tz)->toDateString();

                $log = JpDailyLog::where('user_id', $userId)
                    ->where('reviewed_at', $today)
                    ->lockForUpdate()
                    ->first();

                if (!$log) {
                    JpDailyLog::create([
                        'user_id' => $userId,
                        'reviewed_at' => $today,
                        'status' => true,
                    ]);
                } elseif (!$log->status) {
                    $log->forceFill(['status' => true])->save();
                }
            });
        }

        return ['updated' => $anyUpdated];
    }

    /**
     * Get practice scenarios
     */
    public function getPracticeScenarios(int $userId, Carbon $now): array
    {
        $words = JpWord::with(['hanviet', 'examples'])
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', false)
            ->where('next_review_at', '<=', $now)
            ->orderBy('next_review_at')
            ->limit(100)
            ->get();

        if ($words->isEmpty()) {
            return [
                'totalWords' => 0,
                'scenarios' => [],
            ];
        }

        $scenarios = [];
        $previousQuizType = null;

        foreach ($words as $index => $word) {
            try {
                $quizType = $this->determineQuizType($word, false, $previousQuizType);

                $scenarios[] = [
                    'order' => $index + 1,
                    'word' => $this->formatWord($word),
                    'quizType' => $quizType,
                ];

                $previousQuizType = $quizType;
            } catch (\Exception $e) {
                Log::error('Error processing word', [
                    'word_id' => $word->id,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }
        }

        return [
            'totalWords' => $words->count(),
            'scenarios' => $scenarios,
        ];
    }

    /**
     * Get streak factor based on streak value
     */
    private function getStreakFactor(int $streak): float
    {
        if ($streak <= 1) {
            return 1.00;
        } elseif ($streak <= 3) {
            return 1.15;
        } else {
            return 1.30;
        }
    }

    /**
     * Get lapse factor based on lapses value
     */
    private function getLapseFactor(int $lapses): float
    {
        if ($lapses <= 1) {
            return 1.00;
        } elseif ($lapses <= 4) {
            return 0.85;
        } elseif ($lapses <= 7) {
            return 0.70;
        } else {
            return 0.60;
        }
    }

    /**
     * Get base wait time in seconds for a given level
     */
    private function getBaseWaitSeconds(int $level): int
    {
        return match ($level) {
            1 => 30,           // 30 seconds
            2 => 600,          // 10 minutes
            3 => 86400,        // 1 day
            4 => 259200,       // 3 days
            5 => 604800,       // 7 days
            6 => 1814400,      // 21 days
            7 => 7776000,      // 90 days
            default => 30,     // Default to 30 seconds
        };
    }

    /**
     * Calculate review interval in seconds based on level, streak, and lapses
     */
    private function calculateInterval(int $level, int $streak, int $lapses): int
    {
        $baseWait = $this->getBaseWaitSeconds($level);
        $streakFactor = $this->getStreakFactor($streak);
        $lapseFactor = $this->getLapseFactor($lapses);

        $interval = round($baseWait * $streakFactor * $lapseFactor);
        $minInterval = 30; // Minimum 30 seconds

        return max($minInterval, $interval);
    }

    /**
     * Compute streak
     */
    private function computeStreak(int $userId, Carbon $now, bool $cleanup = true): int
    {
        $cursor = $now->copy()->startOfDay();

        // Dọn theo log sai mới nhất
        if ($cleanup) {
            $latestFalse = JpDailyLog::where('user_id', $userId)
                ->where('status', 0)
                ->orderByDesc('reviewed_at')
                ->first();

            if ($latestFalse) {
                $cutDate = Carbon::parse($latestFalse->reviewed_at)->toDateString();
                JpDailyLog::where('user_id', $userId)
                    ->whereDate('reviewed_at', '<=', $cutDate)
                    ->delete();
            }
        }

        // Lấy tất cả ngày học thành công
        $successDaysDesc = JpDailyLog::where('user_id', $userId)
            ->where('status', 1)
            ->select(DB::raw('DATE(reviewed_at) as d'))
            ->orderByRaw('DATE(reviewed_at) DESC')
            ->pluck('d')
            ->toArray();

        if (empty($successDaysDesc)) {
            return 0;
        }

        $successDaysDesc = array_values(array_unique($successDaysDesc));
        $daySet = array_fill_keys($successDaysDesc, true);

        // Nếu hôm nay chưa học, lùi về ngày học gần nhất
        if (!isset($daySet[$cursor->toDateString()])) {
            $nearest = null;
            foreach ($successDaysDesc as $d) {
                if ($d <= $now->toDateString()) {
                    $nearest = $d;
                    break;
                }
            }
            if (!$nearest) {
                return 0;
            }
            $cursor = Carbon::parse($nearest);
        }

        // Đếm streak
        $streak = 0;
        while (true) {
            $d = $cursor->toDateString();
            if (isset($daySet[$d])) {
                $streak++;
                $cursor->subDay();
                continue;
            }

            if ($cleanup && $streak > 0) {
                JpDailyLog::where('user_id', $userId)
                    ->whereDate('reviewed_at', '<=', $d)
                    ->delete();
            }
            break;
        }

        return $streak;
    }

    /**
     * Determine quiz type for a word
     */
    private function determineQuizType(JpWord $word, bool $checkStrokeData = true, ?string $previousQuizType = null): ?string
    {
        $allQuizTypes = [
            'multiple',
            'hiraganaPractice',
            'romajiPractice',
            'voicePractice',
            'multiCharStrokePractice',
        ];

        $hasKanji = $this->containsKanji($word->kanji);

        $hasStrokeData = false;
        if ($checkStrokeData) {
            try {
                $hasStrokeData = $this->canStrokeWordCN($word->kanji);
            } catch (\Exception $e) {
                Log::warning('Error checking stroke data', [
                    'word_id' => $word->id,
                    'error' => $e->getMessage(),
                ]);
                $hasStrokeData = false;
            }
        }

        $availableTypes = $allQuizTypes;

        if (!$hasStrokeData) {
            $availableTypes = array_filter($availableTypes, function ($type) {
                return $type !== 'multiCharStrokePractice';
            });
        }

        if (!$hasKanji) {
            $availableTypes = array_filter($availableTypes, function ($type) {
                return $type !== 'hiraganaPractice';
            });
        }

        if ($previousQuizType !== null) {
            $availableTypes = array_filter($availableTypes, function ($type) use ($previousQuizType) {
                return $type !== $previousQuizType;
            });
        }

        $availableTypes = array_values($availableTypes);

        if (empty($availableTypes)) {
            $availableTypes = $allQuizTypes;

            if (!$hasStrokeData) {
                $availableTypes = array_filter($availableTypes, function ($type) {
                    return $type !== 'multiCharStrokePractice';
                });
            }

            if (!$hasKanji) {
                $availableTypes = array_filter($availableTypes, function ($type) {
                    return $type !== 'hiraganaPractice';
                });
            }

            $availableTypes = array_values($availableTypes);

            if (empty($availableTypes)) {
                return null;
            }

            if (count($availableTypes) === 1 && $availableTypes[0] === $previousQuizType) {
                return $availableTypes[0];
            }

            if ($previousQuizType !== null) {
                $availableTypes = array_filter($availableTypes, function ($type) use ($previousQuizType) {
                    return $type !== $previousQuizType;
                });
                $availableTypes = array_values($availableTypes);
            }
        }

        if (empty($availableTypes)) {
            return null;
        }

        return $availableTypes[array_rand($availableTypes)];
    }

    /**
     * Check if text contains Kanji
     */
    private function containsKanji(?string $text): bool
    {
        if (empty($text)) {
            return false;
        }
        return preg_match('/\p{Han}/u', $text) === 1;
    }

    /**
     * Check if character has stroke data
     */
    private function hasStrokeDataForChar(string $char): bool
    {
        static $cache = [];

        if (isset($cache[$char])) {
            return $cache[$char];
        }

        $url = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/' . urlencode($char) . '.json';

        try {
            $response = Http::timeout(3)->get($url);
            $hasData = $response->successful() && $response->json() !== null;
            $cache[$char] = $hasData;
            return $hasData;
        } catch (\Exception $e) {
            $cache[$char] = false;
            return false;
        }
    }

    /**
     * Check if word can be stroked
     */
    private function canStrokeWordCN(?string $word): bool
    {
        if (empty($word)) {
            return false;
        }

        $text = trim($word);
        if (empty($text)) {
            return false;
        }

        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);
        $hanChars = [];

        foreach ($chars as $char) {
            if ($this->containsKanji($char)) {
                $hanChars[$char] = true;
            }
        }

        $hanChars = array_keys($hanChars);

        if (empty($hanChars)) {
            return false;
        }

        foreach ($hanChars as $char) {
            if (!$this->hasStrokeDataForChar($char)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Format word for response
     */
    private function formatWord(JpWord $word): array
    {
        $examples = [];
        if ($word->examples && $word->examples->isNotEmpty()) {
            $examples = $word->examples->map(function ($example) {
                return [
                    'sentence_jp' => $example->sentence_jp ?? '',
                    'sentence_romaji' => $example->sentence_romaji ?? '',
                    'sentence_vi' => $example->sentence_vi ?? '',
                ];
            })->toArray();
        }

        return [
            'id' => $word->id,
            'kanji' => $word->kanji ?? '',
            'reading_hiragana' => $word->reading_hiragana,
            'reading_romaji' => $word->reading_romaji,
            'meaning_vi' => $word->meaning_vi,
            'examples' => $examples,
            'hanviet' => $word->hanviet ? [
                'han_viet' => $word->hanviet->han_viet ?? '',
                'explanation' => $word->hanviet->explanation ?? '',
            ] : null,
        ];
    }
}

