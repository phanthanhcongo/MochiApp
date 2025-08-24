<?php

namespace App\Http\Controllers\Api;

use App\Models\JpDailyLog;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JpWord;
use App\Models\EnWord;
use App\Models\EnDailyLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Arr;

class EnglishController extends Controller
{
    //english

    public function updateReviewedWordsEn(Request $request)
    {
        // 1) Bảo vệ: yêu cầu đăng nhập
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $userId = $user->id;

        // 2) Lấy và kiểm tra payload
        $reviewedWords = (array) $request->input('reviewedWords', []);
        if (empty($reviewedWords)) {
            return response()->json(['message' => 'Nothing to update'], 200);
        }

        $updated = 0;

        try {
            DB::transaction(function () use ($userId, $reviewedWords, &$updated) {
                foreach ($reviewedWords as $log) {
                    $wordId = data_get($log, 'word.id');
                    if (!$wordId) {
                        // thiếu id thì bỏ qua
                        continue;
                    }

                    $firstFailed = (bool) data_get($log, 'firstFailed', false);

                    // 3) Parse reviewedAt an toàn
                    $reviewedAtStr = data_get($log, 'reviewedAt'); // có thể null
                    try {
                        $reviewedAt = $reviewedAtStr ? Carbon::parse($reviewedAtStr) : now();
                    } catch (\Throwable $pe) {
                        // format lỗi → fallback now()
                        \Log::warning('Invalid reviewedAt, fallback to now()', [
                            'user_id' => $userId,
                            'value'   => $reviewedAtStr,
                            'err'     => $pe->getMessage(),
                        ]);
                        $reviewedAt = now();
                    }

                    // 4) Khóa bản ghi của đúng user
                    $enWord = EnWord::where('id', $wordId)
                        ->where('user_id', $userId)
                        ->lockForUpdate()
                        ->first();

                    if (!$enWord) {
                        // không thuộc user hoặc không tồn tại
                        continue;
                    }

                    $currentLevel = max(1, (int) ($enWord->level ?? 1));
                    $newLevel = $firstFailed
                        ? max(1, $currentLevel - 1)
                        : min(7, $currentLevel + 1);

                    // 5) Tính lịch hẹn lần sau (level 1 bạn đang để 1 giờ)
                    $nextReviewAt = match ($newLevel) {
                        1 => $reviewedAt->copy()->addHours(1),
                        2 => $reviewedAt->copy()->addHours(6),
                        3 => $reviewedAt->copy()->addDay(),
                        4 => $reviewedAt->copy()->addDays(3),
                        5 => $reviewedAt->copy()->addDays(7),
                        6 => $reviewedAt->copy()->addDays(14),
                        7 => $reviewedAt->copy()->addDays(30),
                        default => $reviewedAt->copy()->addDay(), // bảo hiểm
                    };

                    // 6) Cập nhật từ
                    $enWord->forceFill([
                        'level'            => $newLevel,
                        'last_reviewed_at' => $reviewedAt,
                        'next_review_at'   => $nextReviewAt,
                    ])->save();

                    $updated++;
                }

                // 7) Ghi nhật ký “đã ôn hôm nay” (1 lần/ngày)
                if (class_exists(EnDailyLog::class)) {
                    $today = Carbon::today(config('app.timezone', 'Asia/Bangkok'))->toDateString();

                    $log = EnDailyLog::where('user_id', $userId)
                        ->where('reviewed_at', $today)
                        ->lockForUpdate()
                        ->first();

                    if (!$log) {
                        // dùng forceCreate để tránh MassAssignmentException
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
        } catch (\Throwable $e) {
            \Log::error('updateReviewedWordsEn failed', [
                'user_id' => $userId,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'first_item' => $reviewedWords[0] ?? null,
            ]);

            return response()->json([
                'message' => 'Failed to update reviewed words',
                'error'   => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'EN review log updated',
            'updated' => $updated,
        ]);
    }
    public function store(Request $request)
    {
        \Log::info('Incoming request data:', [
            'all' => $request->all(),           // toàn bộ dữ liệu JSON/Form
            'headers' => $request->headers->all(), // tất cả headers
            'method' => $request->method(),     // phương thức HTTP
            'url' => $request->fullUrl(),       // URL đầy đủ
        ]);
        // Có thể tùy chỉnh validate chi tiết hơn nếu bạn muốn
        $data = $request->validate([
            'words' => ['required', 'array', 'min:1'],
            'words.*.word' => ['required', 'string'],
            'words.*.ipa' => ['nullable', 'string'],
            'words.*.meaning_vi' => ['required', 'string'],
            'words.*.cefr_level' => ['nullable'],
            'words.*.level' => ['nullable', 'integer'],
            'words.*.context_vi' => ['nullable', 'string'],
            'words.*.exampleEn' => ['nullable', 'string'],
            'words.*.exampleVi' => ['nullable', 'string'],
            'words.*.examples' => ['nullable', 'array'],
            'words.*.examples.*.sentence_en' => ['required_with:words.*.examples', 'string'],
            'words.*.examples.*.sentence_vi' => ['nullable', 'string'],
            'words.*.examples.*.exercises' => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.question_text' => ['required_with:words.*.examples.*.exercises', 'string'],
            'words.*.examples.*.exercises.*.answer_explanation' => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.question_type' => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.blank_position' => ['nullable'], // int hoặc null tùy schema
            'words.*.examples.*.exercises.*.choices' => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.choices.*.content' => ['required_with:words.*.examples.*.exercises.*.choices', 'string'],
            'words.*.examples.*.exercises.*.choices.*.is_correct' => ['required_with:words.*.examples.*.exercises.*.choices', 'integer'],
        ]);

        $userId = optional($request->user())->id; // hoặc null nếu không đăng nhập
        $now = Carbon::now();

        $result = DB::transaction(function () use ($data, $userId, $now) {
            $created = [];

            foreach ($data['words'] as $wIndex => $w) {
                // Insert en_words
                $wordId = DB::table('en_words')->insertGetId([
                    'user_id'          => $userId,
                    'word'             => trim($w['word']),
                    'ipa'              => trim((string) ($w['ipa'] ?? '')),
                    'meaning_vi'       => trim($w['meaning_vi']),
                    'cefr_level'       => Arr::get($w, 'cefr_level'),
                    'level'            => (int) ($w['level'] ?? 1),
                    'last_reviewed_at' => $now,
                    'next_review_at'   => $now,
                    'exampleEn'        => trim((string) ($w['exampleEn'] ?? '')),
                    'exampleVn'        => trim((string) ($w['exampleVi'] ?? '')),
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);

                // Optional: en_contexts
                $contextVi = trim((string) ($w['context_vi'] ?? ''));
                if ($contextVi !== '') {
                    DB::table('en_contexts')->insert([
                        'en_word_id' => $wordId,
                        'context_vi' => $contextVi,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                $createdExamples = [];
                foreach ((array) ($w['examples'] ?? []) as $ex) {
                    // Insert en_examples
                    $exampleId = DB::table('en_examples')->insertGetId([
                        'en_word_id'  => $wordId,
                        'sentence_en' => trim($ex['sentence_en']),
                        'sentence_vi' => trim((string) ($ex['sentence_vi'] ?? '')),
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]);

                    $createdExercises = [];
                    foreach ((array) ($ex['exercises'] ?? []) as $exer) {
                        // Insert en_example_exercises
                        $exerciseId = DB::table('en_example_exercises')->insertGetId([
                            'example_id'         => $exampleId,
                            'question_type'      => $exer['question_type'] ?? 'FillInBlankPractice',
                            'question_text'      => trim($exer['question_text']),
                            'blank_position'     => Arr::get($exer, 'blank_position'), // có thể null
                            'answer_explanation' => trim((string) ($exer['answer_explanation'] ?? '')),
                            'created_at'         => $now,
                            'updated_at'         => $now,
                        ]);

                        // Insert en_exercise_choices
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

                        $createdExercises[] = $exerciseId;
                    }

                    $createdExamples[] = [
                        'example_id'   => $exampleId,
                        'exercise_ids' => $createdExercises,
                    ];
                }

                $created[] = [
                    'word_id'        => $wordId,
                    'example_groups' => $createdExamples,
                ];
            }

            return $created;
        });

        return response()->json([
            'message' => 'Inserted successfully',
            'data'    => $result,   // giữ lại danh sách id đã tạo để debug
        ], 200);
    }
    public function index()
    {
        // Query cơ bản
        $words = DB::table('en_words')
            ->select('id', 'word', 'ipa', 'meaning_vi', 'cefr_level', 'level', 'last_reviewed_at', 'next_review_at', 'exampleEn', 'exampleVn', 'created_at', 'updated_at')
            ->get();

        // Lấy tất cả id để join bảng liên quan
        $wordIds = $words->pluck('id')->toArray();

        // Lấy contexts
        $contexts = DB::table('en_contexts')
            ->whereIn('en_word_id', $wordIds)
            ->get()
            ->groupBy('en_word_id');

        // Lấy examples
        $examples = DB::table('en_examples')
            ->whereIn('en_word_id', $wordIds)
            ->get()
            ->groupBy('en_word_id');

        // Lấy exercises theo example_id
        $exampleIds = $examples->flatten()->pluck('id')->toArray();
        $exercises = DB::table('en_example_exercises')
            ->whereIn('example_id', $exampleIds)
            ->get()
            ->groupBy('example_id');

        // Lấy choices theo exercise_id
        $exerciseIds = $exercises->flatten()->pluck('id')->toArray();
        $choices = DB::table('en_exercise_choices')
            ->whereIn('exercise_id', $exerciseIds)
            ->get()
            ->groupBy('exercise_id');

        // Gắn dữ liệu vào từng word
        $words->transform(function ($word) use ($contexts, $examples, $exercises, $choices) {
            $word->contexts = $contexts->get($word->id) ?? [];

            // Gắn examples + exercises + choices
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

        return response()->json([
            'message' => 'Fetched all words successfully',
            'data' => $words
        ], 200);
    }
    public function destroy($id, Request $request)
    {
        // Nếu có ràng buộc user, mở comment 2 dòng dưới để bảo vệ dữ liệu:
        $userId = optional($request->user())->id;
        $word = DB::table('en_words')->where('id', $id)->where('user_id', $userId)->first();

        // $word = DB::table('en_words')->where('id', $id)->first();
        if (!$word) {
            return response()->json([
                'message' => 'Word not found',
            ], 404);
        }

        DB::transaction(function () use ($id) {
            // 1) Lấy tất cả example_id theo word
            $exampleIds = DB::table('en_examples')
                ->where('en_word_id', $id)
                ->pluck('id')
                ->all();

            if (!empty($exampleIds)) {
                // 2) Lấy tất cả exercise_id theo example
                $exerciseIds = DB::table('en_example_exercises')
                    ->whereIn('example_id', $exampleIds)
                    ->pluck('id')
                    ->all();

                // 3) Xóa choices theo exercise_id
                if (!empty($exerciseIds)) {
                    DB::table('en_exercise_choices')
                        ->whereIn('exercise_id', $exerciseIds)
                        ->delete();
                }

                // 4) Xóa exercises theo example_id
                DB::table('en_example_exercises')
                    ->whereIn('example_id', $exampleIds)
                    ->delete();

                // 5) Xóa examples theo word
                DB::table('en_examples')
                    ->whereIn('id', $exampleIds)
                    ->delete();
            }

            // 6) Xóa contexts theo word
            DB::table('en_contexts')
                ->where('en_word_id', $id)
                ->delete();

            // 7) Cuối cùng xóa word
            DB::table('en_words')
                ->where('id', $id)
                ->delete();
        });

        return response()->json([
            'message' => 'Deleted successfully',
            'id'      => (int) $id,
        ], 200);
    }
    public function getById(Request $request, $id)
    {
        try {
            // 1) Lấy user_id: ưu tiên từ auth, fallback từ query/body (để test Postman)
            $authUserId = optional($request->user())->id; // cần middleware auth:* nếu dùng
            $userId = $authUserId ?? $request->integer('user_id');

            if (!$userId) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Missing user_id (no auth user and no user_id provided).',
                ], 400, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            // 2) Tìm theo cặp (id, user_id)
            $word = EnWord::with([
                'contexts',
                'examples.exercises.choices',
            ])
                ->where('id', (int) $id)
                ->where('user_id', (int) $userId)
                ->first();

            if (!$word) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Word not found for this user.',
                ], 404, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            return response()->json([
                'status'  => 'ok',
                'message' => 'Fetched successfully',
                'data'    => $word,
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Throwable $e) {
            \Log::error('GET /en/practice/{id} failed', [
                'id'      => $id,
                'user_id' => optional($request->user())->id ?? $request->input('user_id'),
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Server error',
                'error'   => $e->getMessage(), // bỏ đi nếu không muốn lộ chi tiết
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
    public function update(Request $request, $id = null)
    {
        \Log::info('Incoming update data:', [
            'all'     => $request->all(),
            'headers' => $request->headers->all(),
            'method'  => $request->method(),
            'url'     => $request->fullUrl(),
        ]);

        // user_id ưu tiên từ auth; nếu không có thì cho phép truyền qua payload để test Postman
        $authUserId = optional($request->user())->id;

        // Validate giống store nhưng thêm yêu cầu id cho từng word
        $data = $request->validate([
            'words' => ['required', 'array', 'min:1'],

            'words.*.id'          => ['required', 'integer', 'min:1'], // id en_words cần update
            'words.*.user_id'     => ['nullable', 'integer'],          // dùng khi không auth

            'words.*.word'        => ['required', 'string'],
            'words.*.ipa'         => ['nullable', 'string'],
            'words.*.meaning_vi'  => ['required', 'string'],
            'words.*.cefr_level'  => ['nullable', 'in:A1,A2,B1,B2,C1,C2'],
            'words.*.level'       => ['nullable', 'integer', 'min:1'],
            'words.*.last_reviewed_at' => ['nullable', 'date'],
            'words.*.next_review_at'   => ['nullable', 'date'],
            'words.*.context_vi'  => ['nullable', 'string'],
            'words.*.exampleEn'   => ['nullable', 'string'],
            'words.*.exampleVi'   => ['nullable', 'string'],

            'words.*.examples'                                        => ['nullable', 'array'],
            'words.*.examples.*.id'                                   => ['nullable', 'integer'],
            'words.*.examples.*.sentence_en'                          => ['required_with:words.*.examples', 'string'],
            'words.*.examples.*.sentence_vi'                          => ['nullable', 'string'],

            'words.*.examples.*.exercises'                            => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.id'                       => ['nullable', 'integer'],
            'words.*.examples.*.exercises.*.question_text'            => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.answer_explanation'       => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.question_type'            => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.blank_position'           => ['nullable', 'integer', 'min:1'],

            'words.*.examples.*.exercises.*.choices'                  => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.choices.*.id'             => ['nullable', 'integer'],
            'words.*.examples.*.exercises.*.choices.*.content'        => ['required_with:words.*.examples.*.exercises.*.choices', 'string'],
            'words.*.examples.*.exercises.*.choices.*.is_correct'     => ['required_with:words.*.examples.*.exercises.*.choices', 'integer'],
        ]);

        $now = Carbon::now();

        try {
            $updated = DB::transaction(function () use ($data, $authUserId, $now, $id) {
                $out = [];

                foreach ($data['words'] as $idx => $w) {
                    $wordId = (int) $w['id'];

                    // Chọn user_id: ưu tiên auth, fallback payload
                    $userId = $authUserId ?? Arr::get($w, 'user_id');
                    if (!$userId) {
                        throw new \RuntimeException("Missing user_id for word id {$wordId}");
                    }

                    // Kiểm tra record thuộc user
                    $wordRow = DB::table('en_words')
                        ->where('id', $wordId)
                        ->where('user_id', $userId)
                        ->first();

                    if (!$wordRow) {
                        throw new \RuntimeException("Word {$wordId} not found for user {$userId}");
                    }

                    // Chuẩn bị cột update có điều kiện (chỉ set khi gửi lên)
                    $wordUpdate = [
                        'word'        => trim($w['word']),
                        'ipa'         => trim((string) ($w['ipa'] ?? '')),
                        'meaning_vi'  => trim($w['meaning_vi']),
                        'cefr_level'  => Arr::get($w, 'cefr_level'),
                        'level'       => (int) ($w['level'] ?? $wordRow->level ?? 1),
                        'exampleEn'   => trim((string) ($w['exampleEn'] ?? '')),
                        'exampleVn'   => trim((string) ($w['exampleVi'] ?? Arr::get($w, 'exampleVn', ''))),
                        'updated_at'  => $now,
                    ];

                    // last/next reviewed: chỉ set khi có field
                    if (Arr::has($w, 'last_reviewed_at') && $w['last_reviewed_at'] !== null) {
                        $wordUpdate['last_reviewed_at'] = Carbon::parse($w['last_reviewed_at']);
                    }
                    if (Arr::has($w, 'next_review_at') && $w['next_review_at'] !== null) {
                        $wordUpdate['next_review_at'] = Carbon::parse($w['next_review_at']);
                    }

                    DB::table('en_words')
                        ->where('id', $wordId)
                        ->where('user_id', $userId)
                        ->update($wordUpdate);

                    // ---- Context (chỉ 1) ----
                    $contextVi = trim((string) ($w['context_vi'] ?? ''));
                    if ($contextVi !== '') {
                        $contextRow = DB::table('en_contexts')
                            ->where('en_word_id', $wordId)
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
                                'en_word_id' => $wordId,
                                'context_vi' => $contextVi,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);
                        }
                    }

                    // ---- Examples → Exercises → Choices ----
                    $exampleGroups = [];
                    foreach ((array) Arr::get($w, 'examples', []) as $ex) {
                        $exampleId = Arr::get($ex, 'id');

                        $exampleCols = [
                            'en_word_id'  => $wordId,
                            'sentence_en' => trim((string) Arr::get($ex, 'sentence_en', '')),
                            'sentence_vi' => trim((string) Arr::get($ex, 'sentence_vi', '')),
                            'updated_at'  => $now,
                        ];

                        if ($exampleId) {
                            // update example
                            DB::table('en_examples')
                                ->where('id', $exampleId)
                                ->where('en_word_id', $wordId)
                                ->update($exampleCols);
                        } else {
                            // insert example
                            $exampleCols['created_at'] = $now;
                            $exampleId = DB::table('en_examples')->insertGetId($exampleCols);
                        }

                        $exerciseIds = [];
                        foreach ((array) Arr::get($ex, 'exercises', []) as $exer) {
                            $exerciseId = Arr::get($exer, 'id');

                            // question_text: nếu rỗng thì sync từ sentence_en
                            $qText = trim((string) (
                                Arr::get($exer, 'question_text') ??
                                Arr::get($ex,   'sentence_en')   ?? ''
                            ));

                            // blank_position: nếu null => tính theo "____"
                            $blankPos = Arr::has($exer, 'blank_position')
                                ? Arr::get($exer, 'blank_position')
                                : $this->computeBlankPositionForUpdate(Arr::get($ex, 'sentence_en'));

                            $exerciseCols = [
                                'example_id'         => $exampleId,
                                'question_text'      => $qText,
                                'blank_position'     => $blankPos, // có thể null
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

                            // ---- Choices: chỉ 1 đáp án đúng cần update/insert ----
                            $choice = Arr::get($exer, 'choices.0', []);
                            $choiceContent = trim((string) Arr::get($choice, 'content', ''));
                            if ($choiceContent !== '') {
                                $choiceId = Arr::get($choice, 'id');

                                if ($choiceId) {
                                    // Update theo id (nếu id hợp lệ của exercise)
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
                                        // Fallback: update/insert theo is_correct = 1
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
                                    // Không có id -> upsert theo is_correct = 1
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

                            $exerciseIds[] = $exerciseId;
                        }

                        $exampleGroups[] = [
                            'example_id'   => $exampleId,
                            'exercise_ids' => $exerciseIds,
                        ];
                    }

                    $out[] = [
                        'word_id'        => $wordId,
                        'example_groups' => $exampleGroups,
                    ];
                }

                return $out;
            });

            return response()->json([
                'status'  => 'ok',
                'message' => 'Updated successfully',
                'data'    => $updated,
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Throwable $e) {
            \Log::error('Update word failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Server error',
                'error'   => $e->getMessage(),
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }

    /** helper: tính vị trí (1-based) của "____" trong câu */
    private function computeBlankPositionForUpdate(?string $sentence): ?int
    {
        if (!$sentence) return null;
        $parts = preg_split('/\s+/', $sentence) ?: [];
        foreach ($parts as $i => $tok) {
            if ($tok === '____') return $i + 1;
        }
        return null;
    }
}
