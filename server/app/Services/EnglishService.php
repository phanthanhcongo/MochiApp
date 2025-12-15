<?php

namespace App\Services;

use App\Models\EnWord;
use App\Models\EnDailyLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class EnglishService
{
    /**
     * Import vocabulary from array of words
     */
    public function importVocabulary(array $words, int $userId): array
    {
        $now = Carbon::now();
        $committed = [];
        $duplicates = [];
        $seenInBatch = [];

        DB::transaction(function () use ($words, $userId, $now, &$committed, &$duplicates, &$seenInBatch) {
            foreach ($words as $w) {
                $rawWord = trim($w['word']);
                if ($rawWord === '') {
                    continue;
                }
                $norm = mb_strtolower($rawWord);

                // Chặn trùng trong chính payload
                if (isset($seenInBatch[$norm])) {
                    $duplicates[] = $rawWord;
                    continue;
                }
                $seenInBatch[$norm] = true;

                // Check trùng trong DB
                $query = DB::table('en_words')->where('word', $rawWord);
                if (!is_null($userId)) {
                    $query->where('user_id', $userId);
                } else {
                    $query->whereNull('user_id');
                }
                $exists = $query->exists();

                if ($exists) {
                    $duplicates[] = $rawWord;
                    continue;
                }

                // Insert en_words
                $wordId = DB::table('en_words')->insertGetId([
                    'user_id'          => $userId,
                    'word'             => $rawWord,
                    'ipa'              => trim((string) ($w['ipa'] ?? '')),
                    'meaning_vi'       => trim($w['meaning_vi']),
                    'cefr_level'       => Arr::get($w, 'cefr_level'),
                    'level'            => (int) ($w['level'] ?? 1),
                    'is_grammar'       => (bool) ($w['is_grammar'] ?? false),
                    'streak'           => 0,
                    'lapses'           => 0,
                    'last_reviewed_at' => Carbon::now()->subDays(3),
                    'next_review_at'   => Carbon::now()->subDays(2),
                    'exampleEn'        => trim((string) ($w['exampleEn'] ?? '')),
                    'exampleVn'        => trim((string) ($w['exampleVi'] ?? '')),
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);

                // en_contexts (optional)
                $contextVi = trim((string) ($w['context_vi'] ?? ''));
                if ($contextVi !== '') {
                    DB::table('en_contexts')->insert([
                        'en_word_id' => $wordId,
                        'context_vi' => $contextVi,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                // en_examples + en_example_exercises + en_exercise_choices (optional)
                foreach ((array) ($w['examples'] ?? []) as $ex) {
                    $exampleId = DB::table('en_examples')->insertGetId([
                        'en_word_id'  => $wordId,
                        'sentence_en' => trim($ex['sentence_en']),
                        'sentence_vi' => trim((string) ($ex['sentence_vi'] ?? '')),
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]);

                    foreach ((array) ($ex['exercises'] ?? []) as $exer) {
                        $exerciseId = DB::table('en_example_exercises')->insertGetId([
                            'example_id'         => $exampleId,
                            'question_type'      => $exer['question_type'] ?? 'FillInBlankPractice',
                            'question_text'      => trim($exer['question_text']),
                            'blank_position'     => Arr::get($exer, 'blank_position'),
                            'answer_explanation' => trim((string) ($exer['answer_explanation'] ?? '')),
                            'created_at'         => $now,
                            'updated_at'         => $now,
                        ]);

                        foreach ((array) ($exer['choices'] ?? []) as $choice) {
                            $content = trim((string) ($choice['content'] ?? ''));
                            if ($content === '') continue;

                            DB::table('en_exercise_choices')->insert([
                                'exercise_id' => $exerciseId,
                                'content'     => $content,
                                'is_correct'  => (int) ($choice['is_correct'] ?? 0),
                                'created_at'  => $now,
                                'updated_at' => $now,
                            ]);
                        }
                    }
                }

                $committed[] = [
                    'word'   => $rawWord,
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
    public function addWord(array $data, int $userId): EnWord
    {
        $now = Carbon::now();
        $level = (int) ($data['level'] ?? 1);
        $streak = 0; // Default initial streak
        $lapses = 0; // Default initial lapses
        $intervalSeconds = $this->calculateInterval($level, $streak, $lapses);
        $nextReviewAt = $now->copy()->addSeconds($intervalSeconds);

        return DB::transaction(function () use ($data, $userId, $now, $nextReviewAt, $streak, $lapses) {
            $wordId = DB::table('en_words')->insertGetId([
                'user_id'          => $userId,
                'word'             => trim($data['word']),
                'ipa'              => trim((string) ($data['ipa'] ?? '')),
                'meaning_vi'       => trim($data['meaning_vi']),
                'cefr_level'       => Arr::get($data, 'cefr_level'),
                'level'            => (int) ($data['level'] ?? 1),
                'is_active'       => (bool) ($data['is_active'] ?? true),
                'is_grammar'       => (bool) ($data['is_grammar'] ?? false),
                'streak'           => $streak,
                'lapses'           => $lapses,
                'last_reviewed_at' => $now,
                'next_review_at'   => $nextReviewAt,
                'exampleEn'        => trim((string) ($data['exampleEn'] ?? '')),
                'exampleVn'        => trim((string) ($data['exampleVi'] ?? '')),
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            // Optional: en_contexts
            $contextVi = trim((string) ($data['context_vi'] ?? ''));
            if ($contextVi !== '') {
                DB::table('en_contexts')->insert([
                    'en_word_id' => $wordId,
                    'context_vi' => $contextVi,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // Examples + exercises + choices
            foreach ((array) ($data['examples'] ?? []) as $ex) {
                $exampleId = DB::table('en_examples')->insertGetId([
                    'en_word_id'  => $wordId,
                    'sentence_en' => trim($ex['sentence_en']),
                    'sentence_vi' => trim((string) ($ex['sentence_vi'] ?? '')),
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]);

                foreach ((array) ($ex['exercises'] ?? []) as $exer) {
                    $exerciseId = DB::table('en_example_exercises')->insertGetId([
                        'example_id'         => $exampleId,
                        'question_type'      => $exer['question_type'] ?? 'FillInBlankPractice',
                        'question_text'      => trim($exer['question_text']),
                        'blank_position'     => Arr::get($exer, 'blank_position'),
                        'answer_explanation' => trim((string) ($exer['answer_explanation'] ?? '')),
                        'created_at'         => $now,
                        'updated_at'         => $now,
                    ]);

                    foreach ((array) ($exer['choices'] ?? []) as $choice) {
                        $content = trim((string) ($choice['content'] ?? ''));
                        if ($content === '') {
                            continue;
                        }
                        DB::table('en_exercise_choices')->insert([
                            'exercise_id' => $exerciseId,
                            'content'     => $content,
                            'is_correct'  => (int) ($choice['is_correct'] ?? 0),
                            'created_at'  => $now,
                            'updated_at'  => $now,
                        ]);
                    }
                }
            }

            return EnWord::find($wordId);
        });
    }

    /**
     * Update a word
     */
    public function updateWord(int $id, array $data, int $userId): EnWord
    {
        $now = Carbon::now();

        return DB::transaction(function () use ($id, $data, $userId, $now) {
            $wordRow = DB::table('en_words')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->first();

            if (!$wordRow) {
                throw new \RuntimeException("Word {$id} not found for user {$userId}");
            }

            $wordUpdate = [
                'word'        => trim($data['word']),
                'ipa'         => trim((string) ($data['ipa'] ?? '')),
                'meaning_vi'  => trim($data['meaning_vi']),
                'cefr_level'  => Arr::get($data, 'cefr_level'),
                'level'       => (int) ($data['level'] ?? $wordRow->level ?? 1),
                'exampleEn'   => trim((string) ($data['exampleEn'] ?? '')),
                'exampleVn'   => trim((string) ($data['exampleVi'] ?? Arr::get($data, 'exampleVn', ''))),
                'updated_at'  => $now,
            ];

            // Update is_grammar if provided
            if (Arr::has($data, 'is_grammar')) {
                $wordUpdate['is_grammar'] = (bool) $data['is_grammar'];
            }

            // Update is_active if provided
            if (Arr::has($data, 'is_active')) {
                $wordUpdate['is_active'] = (bool) $data['is_active'];
            }

            if (Arr::has($data, 'last_reviewed_at') && $data['last_reviewed_at'] !== null) {
                $wordUpdate['last_reviewed_at'] = Carbon::parse($data['last_reviewed_at']);
            }

            // Level: nếu có gửi, cập nhật và tính lại next_review_at
            if (Arr::has($data, 'level')) {
                $level = (int) ($data['level'] ?? 1);
                $wordUpdate['level'] = $level;
                $currentStreak = max(0, (int) ($wordRow->streak ?? 0));
                $currentLapses = max(0, (int) ($wordRow->lapses ?? 0));
                $intervalSeconds = $this->calculateInterval($level, $currentStreak, $currentLapses);
                $wordUpdate['next_review_at'] = $now->copy()->addSeconds($intervalSeconds);
            } elseif (Arr::has($data, 'next_review_at') && $data['next_review_at'] !== null) {
                $wordUpdate['next_review_at'] = Carbon::parse($data['next_review_at']);
            }

            DB::table('en_words')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->update($wordUpdate);

            // Context
            $contextVi = trim((string) ($data['context_vi'] ?? ''));
            if ($contextVi !== '') {
                $contextRow = DB::table('en_contexts')
                    ->where('en_word_id', $id)
                    ->orderBy('id', 'asc')
                    ->first();

                if ($contextRow) {
                    DB::table('en_contexts')
                        ->where('id', $contextRow->id)
                        ->update([
                            'context_vi' => $contextVi,
                            'updated_at' => $now,
                        ]);
                } else {
                    DB::table('en_contexts')->insert([
                        'en_word_id' => $id,
                        'context_vi' => $contextVi,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }

            // Examples → Exercises → Choices
            foreach ((array) Arr::get($data, 'examples', []) as $ex) {
                $exampleId = Arr::get($ex, 'id');

                $exampleCols = [
                    'en_word_id'  => $id,
                    'sentence_en' => trim((string) Arr::get($ex, 'sentence_en', '')),
                    'sentence_vi' => trim((string) Arr::get($ex, 'sentence_vi', '')),
                    'updated_at'  => $now,
                ];

                if ($exampleId) {
                    DB::table('en_examples')
                        ->where('id', $exampleId)
                        ->where('en_word_id', $id)
                        ->update($exampleCols);
                } else {
                    $exampleCols['created_at'] = $now;
                    $exampleId = DB::table('en_examples')->insertGetId($exampleCols);
                }

                foreach ((array) Arr::get($ex, 'exercises', []) as $exer) {
                    $exerciseId = Arr::get($exer, 'id');

                    $qText = trim((string) (
                        Arr::get($exer, 'question_text') ??
                        Arr::get($ex,   'sentence_en')   ?? ''
                    ));

                    $blankPos = Arr::has($exer, 'blank_position')
                        ? Arr::get($exer, 'blank_position')
                        : $this->computeBlankPosition(Arr::get($ex, 'sentence_en'));

                    $exerciseCols = [
                        'example_id'         => $exampleId,
                        'question_text'      => $qText,
                        'blank_position'     => $blankPos,
                        'answer_explanation' => trim((string) Arr::get($exer, 'answer_explanation', '')),
                        'question_type'      => Arr::get($exer, 'question_type', 'FillInBlankPractice'),
                        'updated_at'         => $now,
                    ];

                    if ($exerciseId) {
                        DB::table('en_example_exercises')
                            ->where('id', $exerciseId)
                            ->where('example_id', $exampleId)
                            ->update($exerciseCols);
                    } else {
                        $exerciseCols['created_at'] = $now;
                        $exerciseId = DB::table('en_example_exercises')->insertGetId($exerciseCols);
                    }

                    // Choices
                    $choice = Arr::get($exer, 'choices.0', []);
                    $choiceContent = trim((string) Arr::get($choice, 'content', ''));
                    if ($choiceContent !== '') {
                        $choiceId = Arr::get($choice, 'id');

                        if ($choiceId) {
                            $exists = DB::table('en_exercise_choices')
                                ->where('id', $choiceId)
                                ->where('exercise_id', $exerciseId)
                                ->first();

                            if ($exists) {
                                DB::table('en_exercise_choices')
                                    ->where('id', $choiceId)
                                    ->update([
                                        'content'    => $choiceContent,
                                        'is_correct' => 1,
                                        'updated_at' => $now,
                                    ]);
                            } else {
                                $correct = DB::table('en_exercise_choices')
                                    ->where('exercise_id', $exerciseId)
                                    ->where('is_correct', 1)
                                    ->first();

                                if ($correct) {
                                    DB::table('en_exercise_choices')
                                        ->where('id', $correct->id)
                                        ->update([
                                            'content'    => $choiceContent,
                                            'is_correct' => 1,
                                            'updated_at' => $now,
                                        ]);
                                } else {
                                    DB::table('en_exercise_choices')->insert([
                                        'exercise_id' => $exerciseId,
                                        'content'     => $choiceContent,
                                        'is_correct'  => 1,
                                        'created_at'  => $now,
                                        'updated_at'  => $now,
                                    ]);
                                }
                            }
                        } else {
                            $correct = DB::table('en_exercise_choices')
                                ->where('exercise_id', $exerciseId)
                                ->where('is_correct', 1)
                                ->first();

                            if ($correct) {
                                DB::table('en_exercise_choices')
                                    ->where('id', $correct->id)
                                    ->update([
                                        'content'    => $choiceContent,
                                        'is_correct' => 1,
                                        'updated_at' => $now,
                                    ]);
                            } else {
                                DB::table('en_exercise_choices')->insert([
                                    'exercise_id' => $exerciseId,
                                    'content'     => $choiceContent,
                                    'is_correct'  => 1,
                                    'created_at'  => $now,
                                    'updated_at'  => $now,
                                ]);
                            }
                        }
                    }
                }
            }

            return EnWord::find($id);
        });
    }

    /**
     * Delete a word
     */
    public function deleteWord(int $id, int $userId): bool
    {
        $word = DB::table('en_words')->where('id', $id)->where('user_id', $userId)->first();

        if (!$word) {
            throw new \RuntimeException("Word {$id} not found for user {$userId}");
        }

        return DB::transaction(function () use ($id) {
            $exampleIds = DB::table('en_examples')
                ->where('en_word_id', $id)
                ->pluck('id')
                ->all();

            if (!empty($exampleIds)) {
                $exerciseIds = DB::table('en_example_exercises')
                    ->whereIn('example_id', $exampleIds)
                    ->pluck('id')
                    ->all();

                if (!empty($exerciseIds)) {
                    DB::table('en_exercise_choices')
                        ->whereIn('exercise_id', $exerciseIds)
                        ->delete();
                }

                DB::table('en_example_exercises')
                    ->whereIn('example_id', $exampleIds)
                    ->delete();
            }

            DB::table('en_examples')
                ->whereIn('id', $exampleIds)
                ->delete();

            DB::table('en_contexts')
                ->where('en_word_id', $id)
                ->delete();

            DB::table('en_words')
                ->where('id', $id)
                ->delete();

            return true;
        });
    }

    /**
     * Get practice stats
     */
    public function getStats(int $userId, Carbon $now): array
    {
        // 1. Thống kê số từ theo level (chỉ lấy từ vựng, không lấy ngữ pháp)
        $reviewStats = EnWord::where('user_id', $userId)
            ->where(function ($query) {
                $query->where('is_grammar', false)
                      ->orWhereNull('is_grammar');
            })
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

        // 2. Tổng số từ (chỉ từ vựng, không ngữ pháp)
        $totalWords = EnWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->where('is_grammar', false)
                      ->orWhereNull('is_grammar');
            })
            ->count();

        // 3. Danh sách từ cần ôn (chỉ từ vựng)
        $wordsToReviewList = EnWord::with([
            'contexts',
            'examples.exercises.choices',
        ])
            ->where('is_active', true)
            ->where('user_id', $userId)
            ->where(function ($query) {
                $query->where('is_grammar', false)
                      ->orWhereNull('is_grammar');
            })
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<=', $now)
            ->orderBy('next_review_at')
            ->get();

        // 4. Thời gian đến lần ôn gần nhất (chỉ từ vựng)
        $nearestReviewTime = EnWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->where('is_grammar', false)
                      ->orWhereNull('is_grammar');
            })
            ->where('next_review_at', '>', $now)
            ->min('next_review_at');

        $nextReviewIn = $nearestReviewTime
            ? Carbon::parse($nearestReviewTime)->diff($now)->format('%H:%I:%S')
            : null;

        // 5. Streak
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
        $reviewStats = EnWord::where('user_id', $userId)
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
        $totalGrammar = EnWord::where('user_id', $userId)
            ->where('is_active', true)
            ->where('is_grammar', true)
            ->count();

        // 3. Danh sách NGỮ PHÁP cần ôn
        $grammarToReviewList = EnWord::with([
            'contexts',
            'examples.exercises.choices',
        ])
            ->where('is_active', true)
            ->where('is_grammar', true)
            ->where('user_id', $userId)
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<=', $now)
            ->orderBy('next_review_at')
            ->get();

        // 4. Thời gian đến lần ôn NGỮ PHÁP gần nhất
        $nearestReviewTime = EnWord::where('user_id', $userId)
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
        return EnWord::with(['contexts', 'examples.exercises.choices'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Update reviewed words
     */
    public function updateReviewedWords(array $reviewedWords, int $userId): array
    {
        if (empty($reviewedWords)) {
            return ['updated' => 0];
        }

        $updated = 0;

        DB::transaction(function () use ($userId, $reviewedWords, &$updated) {
            foreach ($reviewedWords as $log) {
                $wordId = data_get($log, 'word.id');
                if (!$wordId) {
                    continue;
                }

                $firstFailed = (bool) data_get($log, 'firstFailed', false);

                $rawIsActive = data_get($log, 'is_active');
                if (is_null($rawIsActive)) {
                    $rawIsActive = data_get($log, 'is_activate');
                }
                if (is_null($rawIsActive)) {
                    $rawIsActive = data_get($log, 'word.is_active');
                }
                if (is_null($rawIsActive)) {
                    $rawIsActive = data_get($log, 'word.is_activate');
                }

                $isActive = null;
                if (!is_null($rawIsActive)) {
                    if (is_bool($rawIsActive)) {
                        $isActive = $rawIsActive;
                    } elseif (is_numeric($rawIsActive)) {
                        $isActive = ((int)$rawIsActive) === 1;
                    } elseif (is_string($rawIsActive)) {
                        $s = strtolower($rawIsActive);
                        $isActive = in_array($s, ['1', 'true', 'yes'], true);
                    }
                }

                $reviewedAtStr = data_get($log, 'reviewedAt');
                try {
                    $reviewedAt = $reviewedAtStr ? Carbon::parse($reviewedAtStr) : now();
                } catch (\Throwable $pe) {
                    Log::warning('Invalid reviewedAt, fallback to now()', [
                        'user_id' => $userId,
                        'value'   => $reviewedAtStr,
                        'err'     => $pe->getMessage(),
                    ]);
                    $reviewedAt = now();
                }

                $enWord = EnWord::where('id', $wordId)
                    ->where('user_id', $userId)
                    ->lockForUpdate()
                    ->first();

                if (!$enWord) {
                    continue;
                }

                $currentLevel = max(1, (int) ($enWord->level ?? 1));
                $currentStreak = max(0, (int) ($enWord->streak ?? 0));
                $currentLapses = max(0, (int) ($enWord->lapses ?? 0));

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

                $updateData = [
                    'level'            => $newLevel,
                    'streak'           => $newStreak,
                    'lapses'           => $newLapses,
                    'last_reviewed_at' => $reviewedAt,
                    'next_review_at'   => $nextReviewAt,
                ];

                if (!is_null($isActive)) {
                    $updateData['is_active'] = $isActive;
                }

                $enWord->forceFill($updateData)->save();
                $updated++;
            }

            // Ghi daily log
            if ($updated > 0 && class_exists(EnDailyLog::class)) {
                $today = Carbon::today(config('app.timezone', 'Asia/Bangkok'))->toDateString();

                $log = EnDailyLog::where('user_id', $userId)
                    ->where('reviewed_at', $today)
                    ->lockForUpdate()
                    ->first();

                if (!$log) {
                    EnDailyLog::forceCreate([
                        'user_id'     => $userId,
                        'reviewed_at' => $today,
                        'status'      => true,
                    ]);
                } elseif (!$log->status) {
                    $log->forceFill(['status' => true])->save();
                }
            }
        });

        return ['updated' => $updated];
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

        if ($cleanup) {
            $latestFalse = EnDailyLog::where('user_id', $userId)
                ->where('status', 0)
                ->orderByDesc('reviewed_at')
                ->first();

            if ($latestFalse) {
                $cutDate = Carbon::parse($latestFalse->reviewed_at)->toDateString();
                EnDailyLog::where('user_id', $userId)
                    ->whereDate('reviewed_at', '<=', $cutDate)
                    ->delete();
            }
        }

        $successDaysDesc = EnDailyLog::where('user_id', $userId)
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

        $streak = 0;
        while (true) {
            $d = $cursor->toDateString();
            if (isset($daySet[$d])) {
                $streak++;
                $cursor->subDay();
                continue;
            }

            if ($cleanup && $streak > 0) {
                EnDailyLog::where('user_id', $userId)
                    ->whereDate('reviewed_at', '<=', $d)
                    ->delete();
            }
            break;
        }

        return $streak;
    }

    /**
     * Compute blank position for update
     */
    private function computeBlankPosition(?string $sentence): ?int
    {
        if (!$sentence) return null;
        $parts = preg_split('/\s+/', $sentence) ?: [];
        foreach ($parts as $i => $tok) {
            if ($tok === '____') return $i + 1;
        }
        return null;
    }

    /**
     * Store multiple words
     */
    public function storeWords(array $words, ?int $userId): array
    {
        $created = [];
        foreach ($words as $w) {
            $word = $this->addWord($w, $userId);
            $created[] = [
                'word_id' => $word->id,
            ];
        }
        return $created;
    }

    /**
     * Get all words with relations (for index)
     */
    public function getAllWordsWithRelations(?int $userId = null): Collection
    {
        $query = DB::table('en_words')
            ->select('id', 'word', 'ipa', 'meaning_vi', 'cefr_level', 'level', 'last_reviewed_at', 'next_review_at', 'exampleEn', 'exampleVn', 'is_active', 'is_grammar', 'created_at', 'updated_at');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $words = $query->get();

        $wordIds = $words->pluck('id')->toArray();

        $contexts = DB::table('en_contexts')
            ->whereIn('en_word_id', $wordIds)
            ->get()
            ->groupBy('en_word_id');

        $examples = DB::table('en_examples')
            ->whereIn('en_word_id', $wordIds)
            ->get()
            ->groupBy('en_word_id');

        $exampleIds = $examples->flatten()->pluck('id')->toArray();
        $exercises = DB::table('en_example_exercises')
            ->whereIn('example_id', $exampleIds)
            ->get()
            ->groupBy('example_id');

        $exerciseIds = $exercises->flatten()->pluck('id')->toArray();
        $choices = DB::table('en_exercise_choices')
            ->whereIn('exercise_id', $exerciseIds)
            ->get()
            ->groupBy('exercise_id');

        $words->transform(function ($word) use ($contexts, $examples, $exercises, $choices) {
            $word->contexts = $contexts->get($word->id) ?? [];

            $exList = $examples->get($word->id) ?? [];
            foreach ($exList as $ex) {
                $exListExercises = $exercises->get($ex->id) ?? [];
                foreach ($exListExercises as $exr) {
                    $exr->choices = $choices->get($exr->id) ?? [];
                }
                $ex->exercises = $exListExercises;
            }
            $word->examples = $exList;

            return $word;
        });

        return $words;
    }

    /**
     * Get word by ID with user validation
     */
    public function getWordById(int $id, ?int $userId): ?EnWord
    {
        if (!$userId) {
            throw new \RuntimeException('Missing user_id');
        }

        $word = EnWord::with([
            'contexts',
            'examples.exercises.choices',
        ])
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$word) {
            throw new \RuntimeException("Word {$id} not found for user {$userId}");
        }

        return $word;
    }

    /**
     * Update multiple words
     */
    public function updateWords(array $words, ?int $authUserId): array
    {
        $updated = [];
        foreach ($words as $w) {
            $wordId = (int) $w['id'];
            $userId = $authUserId ?? Arr::get($w, 'user_id');
            if (!$userId) {
                throw new \RuntimeException("Missing user_id for word id {$wordId}");
            }

            $word = $this->updateWord($wordId, $w, $userId);
            $updated[] = [
                'word_id' => $word->id,
            ];
        }
        return $updated;
    }
}

