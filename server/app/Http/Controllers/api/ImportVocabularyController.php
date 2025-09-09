<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Arr;
use App\Models\JpWord;
use App\Models\JpHanviet;
use App\Models\JpStroke;
use App\Models\JpContext;
use App\Models\JpExample;
use App\Models\JpExampleExercise;
use App\Models\JpExerciseChoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Database\QueryException;

class ImportVocabularyController extends Controller
{
    public function importJP(Request $request)
    {
        $payload = $request->json()->all();
        $items   = isset($payload['data']) ? $payload['data'] : $payload;

        if (!is_array($items)) {
            return response()->json([
                'error' => 'Payload phải là một mảng JSON hoặc object có key "data" là mảng'
            ], 422);
        }

        // Validate từng item
        foreach ($items as $idx => $item) {
            $v = Validator::make($item, [
                'kanji'             => 'required|string',
                'reading_hiragana'  => 'required|string',
                'reading_romaji'    => 'required|string',
                'meaning_vi'        => 'required|string',
                'jlpt_level'        => 'nullable|string',
                'level'             => 'nullable|integer',
                'han_viet'          => 'nullable|string',
                'explanation'       => 'required|string',

                'stroke_url'        => 'nullable|url',
                'audio_url'         => 'nullable|url',

                'contexts'                  => 'nullable|array',
                'contexts.*.context_vi'     => 'required_with:contexts|string',
                'contexts.*.highlight_line' => 'nullable|string',
                'contexts.*.context_jp'     => 'nullable|string',
                'contexts.*.context_hira'   => 'nullable|string',
                'contexts.*.context_romaji' => 'nullable|string',

                'examples'                   => 'nullable|array',
                'examples.*.sentence_jp'     => 'required_with:examples|string',
                'examples.*.sentence_hira'   => 'required_with:examples|string',
                'examples.*.sentence_romaji' => 'required_with:examples|string',
                'examples.*.sentence_vi'     => 'required_with:examples|string',

                'quizzes'                        => 'nullable|array',
                'quizzes.*.question_type'        => 'required_with:quizzes|string',
                'quizzes.*.question_text'        => 'required_with:quizzes|string',
                'quizzes.*.blank_position'       => 'nullable|integer',
                'quizzes.*.answer_explanation'   => 'nullable|string',
                'quizzes.*.choices'              => 'nullable|array',
                'quizzes.*.choices.*.content'    => 'required_with:quizzes.*.choices|string',
                'quizzes.*.choices.*.is_correct' => 'required_with:quizzes.*.choices|boolean',
            ]);

            if ($v->fails()) {
                return response()->json([
                    'error'   => "Item #$idx không hợp lệ",
                    'details' => $v->errors()->toArray(),
                ], 422);
            }
        }

        $userId = Auth::id() ?? 2;

        // Kết quả trả về
        $committed  = []; // [{word: '...', status: 'commit'}]
        $duplicates = []; // ['kanji1', 'kanji2', ...]
        $seenInBatch = []; // chống trùng ngay trong payload

        try {
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
                        continue; // bỏ qua, không insert
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

                    // Ghi nhận commit để trả về client
                    $committed[] = [
                        'word'   => $kanji,
                        'status' => 'commit',
                    ];
                }
            }, 1);

            // Nếu không có dòng nào được thêm thì báo lỗi kèm danh sách trùng
            if (empty($committed)) {
                return response()->json([
                    'error'      => 'Không có từ nào được thêm, toàn bộ đều trùng',
                    'duplicates' => array_values(array_unique($duplicates)),
                ], 409); // Conflict
            }

            // Có thêm được ít nhất 1 từ -> trả thành công, kèm danh sách trùng (nếu có)
            return response()->json([
                'message'    => 'Import thành công',
                'items'      => $committed,
                'duplicates' => array_values(array_unique($duplicates)), // có thể rỗng
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('JP Import failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'error'   => 'Import thất bại, đã rollback',
                'details' => config('app.debug') ? $e->getMessage() : null,
                \Log::error('Import failed', ['details' => $e->getMessage(), 'trace' => $e->getTraceAsString()]),
            ], 500);
        }
    }


    public function importEnglish(Request $request)
    {
        // Log thô request để debug khi cần
        Log::info('EN import incoming', [
            'headers' => $request->headers->all(),
            'method'  => $request->method(),
            'url'     => $request->fullUrl(),
        ]);

        // Validate payload
        $validator = Validator::make($request->all(), [
            'words' => ['required', 'array', 'min:1'],

            'words.*.word'        => ['required', 'string'],
            'words.*.ipa'         => ['nullable', 'string'],
            'words.*.meaning_vi'  => ['required', 'string'],
            'words.*.cefr_level'  => ['nullable'],
            'words.*.level'       => ['nullable', 'integer'],
            'words.*.context_vi'  => ['nullable', 'string'],
            'words.*.exampleEn'   => ['nullable', 'string'],
            'words.*.exampleVi'   => ['nullable', 'string'],

            'words.*.examples'                              => ['nullable', 'array'],
            'words.*.examples.*.sentence_en'                => ['required_with:words.*.examples', 'string'],
            'words.*.examples.*.sentence_vi'                => ['nullable', 'string'],
            'words.*.examples.*.exercises'                  => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.question_text'  => ['required_with:words.*.examples.*.exercises', 'string'],
            'words.*.examples.*.exercises.*.answer_explanation' => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.question_type'  => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.blank_position' => ['nullable'],
            'words.*.examples.*.exercises.*.choices'        => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.choices.*.content'    => ['required_with:words.*.examples.*.exercises.*.choices', 'string'],
            'words.*.examples.*.exercises.*.choices.*.is_correct' => ['required_with:words.*.examples.*.exercises.*.choices', 'integer'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'   => 'Payload không hợp lệ',
                'details' => $validator->errors()->toArray(),
            ], 422);
        }

        $data    = $validator->validated();
        $userId  = optional($request->user())->id; // có thể null nếu không login
        $now     = Carbon::now();
        $incoming = $data['words'];

        // Kết quả trả về
        $committed   = []; // [{ word: '...', status: 'commit' }]
        $duplicates  = []; // ['word1', 'word2', ...]
        $seenInBatch = []; // chống trùng trong cùng payload (case-insensitive)

        try {
            DB::transaction(function () use ($incoming, $userId, $now, &$committed, &$duplicates, &$seenInBatch) {

                foreach ($incoming as $w) {
                    $rawWord = trim($w['word']);
                    if ($rawWord === '') {
                        // Bỏ qua entry rỗng (không coi là duplicate)
                        continue;
                    }
                    $norm = mb_strtolower($rawWord);

                    // 1) Chặn trùng trong chính payload (case-insensitive)
                    if (isset($seenInBatch[$norm])) {
                        $duplicates[] = $rawWord;
                        continue;
                    }
                    $seenInBatch[$norm] = true;

                    // 2) Check trùng trong DB theo (user_id, word)
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

                    // 3) Insert en_words
                    $wordId = DB::table('en_words')->insertGetId([
                        'user_id'          => $userId,
                        'word'             => $rawWord,
                        'ipa'              => trim((string) ($w['ipa'] ?? '')),
                        'meaning_vi'       => trim($w['meaning_vi']),
                        'cefr_level'       => Arr::get($w, 'cefr_level'),
                        'level'            => (int) ($w['level'] ?? 1),
                        'last_reviewed_at' => Carbon::now()->subDays(3),
                        'next_review_at'   => Carbon::now()->subDays(2),
                        'exampleEn'        => trim((string) ($w['exampleEn'] ?? '')),
                        'exampleVn'        => trim((string) ($w['exampleVi'] ?? '')),
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]);

                    // 4) en_contexts (optional)
                    $contextVi = trim((string) ($w['context_vi'] ?? ''));
                    if ($contextVi !== '') {
                        DB::table('en_contexts')->insert([
                            'en_word_id' => $wordId,
                            'context_vi' => $contextVi,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }

                    // 5) en_examples + en_example_exercises + en_exercise_choices (optional)
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
                                    'updated_at'  => $now,
                                ]);
                            }
                        }
                    }

                    // 6) Ghi nhận commit để trả về client
                    $committed[] = [
                        'word'   => $rawWord,
                        'status' => 'commit',
                    ];
                }
            }, 1);

            // Nếu không có dòng nào được thêm thì báo lỗi kèm danh sách trùng
            if (empty($committed)) {
                return response()->json([
                    'error'      => 'Không có từ nào được thêm, toàn bộ đều trùng',
                    'duplicates' => array_values(array_unique($duplicates)),
                ], 409); // Conflict
            }

            // Có thêm được ít nhất 1 từ -> trả thành công, kèm danh sách trùng (nếu có)
            return response()->json([
                'message'    => 'Inserted successfully',
                'items'      => $committed,
                'duplicates' => array_values(array_unique($duplicates)), // có thể rỗng
            ], 201);
        } catch (\Throwable $e) {
            Log::error('EN import failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'error'   => 'Import thất bại, đã rollback',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
