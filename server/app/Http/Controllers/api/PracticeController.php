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

class PracticeController extends Controller
{

    

    public function addWord(Request $request)
    {

        $user = $request->user(); // ->id() có từ token
        $userId = $user->id;
        // validate
        $data = $request->validate([
            // jp_words
            'kanji'            => 'required|string|max:255',
            'reading_hiragana' => 'nullable|string|max:255',
            'reading_romaji'   => 'nullable|string|max:255',
            'meaning_vi'       => 'nullable|string',
            'jlpt_level'       => ['nullable', 'string', Rule::in(['N1', 'N2', 'N3', 'N4', 'N5'])],
            'level'            => 'nullable|integer|min:1|max:7',

            // jp_hanviet
            'han_viet'            => 'nullable|string|max:255',
            'hanviet_explanation' => 'nullable|string',

            // jp_contexts
            'context_vi'          => 'nullable|string',

            // jp_examples
            'sentence_jp'     => 'nullable|string',
            'sentence_hira'   => 'nullable|string',
            'sentence_romaji' => 'nullable|string',
            'sentence_vi'     => 'nullable|string',
        ]);

        if (!$userId) {
            return response()->json(['message' => 'Thiếu user_id'], 422);
        }

        // lịch ôn khởi tạo
        $now   = Carbon::now();
        $level = (int)($data['level'] ?? 1);
        $intervalDays = match ($level) {
            1 => 1,
            2 => 2,
            3 => 4,
            4 => 7,
            5 => 15,
            6 => 30,
            7 => 60,
            default => 1,
        };

        \Log::info('Dữ liệu sau khi validate:', $data);

        return DB::transaction(function () use ($data, $userId, $now, $intervalDays) {
            // 1. jp_words + set lịch ôn
            $word = \App\Models\JpWord::create([
                'user_id'          => $userId,
                'kanji'            => $data['kanji'],
                'reading_hiragana' => $data['reading_hiragana'] ?? null,
                'reading_romaji'   => $data['reading_romaji'] ?? null,
                'meaning_vi'       => $data['meaning_vi'] ?? null,
                'jlpt_level'       => $data['jlpt_level'] ?? null,
                'level'            => $data['level'] ?? 1,
                'last_reviewed_at' => $now,
                'next_review_at'   => $now->copy()->addDays($intervalDays),
            ]);
            \Log::info('Tạo jp_words thành công', ['word_id' => $word->id]);

            // 2. jp_hanviet
            if (!empty($data['han_viet']) || !empty($data['hanviet_explanation'])) {
                \App\Models\JpHanviet::create([
                    'jp_word_id'  => $word->id,
                    'han_viet'    => $data['han_viet'] ?? null,
                    'explanation' => $data['hanviet_explanation'] ?? null,
                ]);
            }

            // 3. jp_contexts
            if (!empty($data['context_vi'])) {
                \App\Models\JpContext::create([
                    'jp_word_id' => $word->id,
                    'context_vi' => $data['context_vi'],
                ]);
            }

            // 4. jp_examples
            if (!empty($data['sentence_jp']) || !empty($data['sentence_vi'])) {
                \App\Models\JpExample::create([
                    'jp_word_id'      => $word->id,
                    'sentence_jp'     => $data['sentence_jp'] ?? null,
                    'sentence_hira'   => $data['sentence_hira'] ?? null,
                    'sentence_romaji' => $data['sentence_romaji'] ?? null,
                    'sentence_vi'     => $data['sentence_vi'] ?? null,
                ]);
            }

            return response()->json([
                'message' => 'Thêm từ vựng thành công',
                'word_id' => $word->id
            ]);
        });
    }
    public function updateWord(Request $request, $id)
    {
        $user = $request->user();
        $userId = $user?->id;

        if (!$userId) {
            return response()->json(['message' => 'Thiếu user'], 401);
        }

        // Validate: tất cả nullable vì đây là update từng phần
        $data = $request->validate([
            // jp_words (phẳng từ FormState)
            'kanji'            => 'nullable|string|max:255',
            'reading_hiragana' => 'nullable|string|max:255',
            'reading_romaji'   => 'nullable|string|max:255',
            'meaning_vi'       => 'nullable|string',
            'jlpt_level'       => ['nullable', 'string', Rule::in(['N1', 'N2', 'N3', 'N4', 'N5'])],
            'level'            => 'nullable|integer|min:1|max:7',

            // jp_hanviet
            'han_viet'            => 'nullable|string|max:255',
            'hanviet_explanation' => 'nullable|string',

            // jp_contexts
            'context_vi'          => 'nullable|string',

            // jp_examples
            'sentence_jp'     => 'nullable|string',
            'sentence_hira'   => 'nullable|string',
            'sentence_romaji' => 'nullable|string',
            'sentence_vi'     => 'nullable|string',
        ]);

        // Tìm word thuộc user hiện tại
        $word = \App\Models\JpWord::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$word) {
            return response()->json(['message' => 'Không tìm thấy từ của người dùng'], 404);
        }

        return DB::transaction(function () use ($data, $word) {
            $updateWord = [];

            // Chỉ set các key có gửi lên
            foreach (['kanji', 'reading_hiragana', 'reading_romaji', 'meaning_vi', 'jlpt_level'] as $k) {
                if (array_key_exists($k, $data)) {
                    $updateWord[$k] = $data[$k]; // có thể null để xóa
                }
            }

            // Level: nếu có gửi, cập nhật và tính lại next_review_at
            if (array_key_exists('level', $data)) {
                $level = (int)($data['level'] ?? 1);
                $updateWord['level'] = $level;

                // Tính lịch ôn mới kể từ bây giờ (có thể đổi sang last_reviewed_at nếu bạn muốn)
                $now = Carbon::now();
                $intervalDays = match ($level) {
                    1 => 1,
                    2 => 2,
                    3 => 4,
                    4 => 7,
                    5 => 15,
                    6 => 30,
                    7 => 60,
                    default => 1,
                };
                $updateWord['next_review_at'] = $now->copy()->addDays($intervalDays);
                // Không bắt buộc đổi last_reviewed_at khi update field, nên mình giữ nguyên
            }

            if (!empty($updateWord)) {
                $word->update($updateWord);
            }

            // === jp_hanviet: upsert hoặc xóa khi rỗng hoàn toàn ===
            $hasHanvietKeys = array_key_exists('han_viet', $data) || array_key_exists('hanviet_explanation', $data);
            if ($hasHanvietKeys) {
                $hvVal = [
                    'han_viet'    => $data['han_viet']            ?? null,
                    'explanation' => $data['hanviet_explanation'] ?? null,
                ];
                $bothEmpty = empty($hvVal['han_viet']) && empty($hvVal['explanation']);

                $existingHv = \App\Models\JpHanviet::where('jp_word_id', $word->id)->first();
                if ($bothEmpty) {
                    if ($existingHv) $existingHv->delete();
                } else {
                    \App\Models\JpHanviet::updateOrCreate(
                        ['jp_word_id' => $word->id],
                        $hvVal
                    );
                }
            }

            // === jp_contexts: 1 context đầu tiên theo thiết kế form phẳng ===
            if (array_key_exists('context_vi', $data)) {
                $ctxVal = trim((string)($data['context_vi'] ?? ''));
                $existingCtx = \App\Models\JpContext::where('jp_word_id', $word->id)->orderBy('id')->first();

                if ($ctxVal === '') {
                    if ($existingCtx) $existingCtx->delete();
                } else {
                    if ($existingCtx) {
                        $existingCtx->update(['context_vi' => $ctxVal]);
                    } else {
                        \App\Models\JpContext::create([
                            'jp_word_id' => $word->id,
                            'context_vi' => $ctxVal,
                        ]);
                    }
                }
            }

            // === jp_examples: 1 example đầu tiên theo thiết kế form phẳng ===
            $hasExampleKeys = array_key_exists('sentence_jp', $data)
                || array_key_exists('sentence_romaji', $data)
                || array_key_exists('sentence_vi', $data)
                || array_key_exists('sentence_hira', $data);

            if ($hasExampleKeys) {
                $exPayload = [
                    'sentence_jp'     => $data['sentence_jp']     ?? null,
                    'sentence_romaji' => $data['sentence_romaji'] ?? null,
                    'sentence_vi'     => $data['sentence_vi']     ?? null,
                    'sentence_hira'   => $data['sentence_hira']   ?? null,
                ];
                $allEmpty = empty($exPayload['sentence_jp'])
                    && empty($exPayload['sentence_romaji'])
                    && empty($exPayload['sentence_vi'])
                    && empty($exPayload['sentence_hira']);

                $existingEx = \App\Models\JpExample::where('jp_word_id', $word->id)->orderBy('id')->first();

                if ($allEmpty) {
                    if ($existingEx) $existingEx->delete();
                } else {
                    if ($existingEx) {
                        $existingEx->update($exPayload);
                    } else {
                        \App\Models\JpExample::create(array_merge($exPayload, [
                            'jp_word_id' => $word->id,
                        ]));
                    }
                }
            }

            return response()->json([
                'message' => 'Cập nhật từ vựng thành công',
                'word_id' => $word->id,
            ]);
        });
    }

    //english

    public function updateReviewedWordsEn(Request $request)
    {
        $userId = $request->user()->id;
        $reviewedWords = (array) $request->input('reviewedWords', []);

        if (empty($reviewedWords)) {
            return response()->json(['message' => 'Nothing to update'], 200);
        }

        DB::transaction(function () use ($userId, $reviewedWords) {
            foreach ($reviewedWords as $log) {
                $wordId = data_get($log, 'word.id');
                if (!$wordId) continue;

                $firstFailed = (bool) data_get($log, 'firstFailed', false);
                $reviewedAt  = Carbon::parse(data_get($log, 'reviewedAt', now()));

                // Khóa bản ghi của đúng user
                $enWord = EnWord::where('id', $wordId)
                    ->where('user_id', $userId)
                    ->lockForUpdate()
                    ->first();

                if (!$enWord) continue;

                $currentLevel = max(1, (int) ($enWord->level ?? 1));

                if ($firstFailed) {
                       // Sai: lùi 1 cấp (tối thiểu 1) và hẹn gần hơn bảng chuẩn
                // Sai: lùi 1 cấp (tối thiểu 1) và hẹn ôn LẬP TỨC
                $newLevel = max(1, $currentLevel - 1);

                // Nếu logic lấy lịch dùng where('next_review_at', '<=', now()) thì giữ nguyên như dưới
                // Nếu dùng so sánh nghiêm ngặt '<', nên đổi sang addSecond(1)
                $nextReviewAt = $reviewedAt->addSecond(5);

                    $enWord->update([
                        'level'            => $newLevel,
                        'last_reviewed_at' => $reviewedAt,
                        'next_review_at'   => $nextReviewAt,
                    ]);
                } else {
                    // ===== Nhánh TRẢ LỜI ĐÚNG =====
                    $newLevel = min(7, $currentLevel + 1);

                    $nextReviewAt = match ($newLevel) {
                        1 => $reviewedAt->copy()->addMinutes(30),
                        2 => $reviewedAt->copy()->addHours(6),
                        3 => $reviewedAt->copy()->addDay(),
                        4 => $reviewedAt->copy()->addDays(3),
                        5 => $reviewedAt->copy()->addDays(7),
                        6 => $reviewedAt->copy()->addDays(14),
                        7 => $reviewedAt->copy()->addDays(30),
                    };

                    $enWord->update([
                        'level'            => $newLevel,
                        'last_reviewed_at' => $reviewedAt,
                        'next_review_at'   => $nextReviewAt,
                    ]);
                }
            }

            // Ghi “đã ôn hôm nay” cho EN (1 lần/ngày)
            if (class_exists(EnDailyLog::class)) {
                $today = Carbon::today(config('app.timezone', 'Asia/Bangkok'))->toDateString();

                $log = EnDailyLog::where('user_id', $userId)
                    ->where('reviewed_at', $today)
                    ->lockForUpdate()
                    ->first();

                if (!$log) {
                    EnDailyLog::create([
                        'user_id'     => $userId,
                        'reviewed_at' => $today,
                        'status'      => true,
                    ]);
                } elseif (!$log->status) {
                    $log->forceFill(['status' => true])->save();
                }
            }
        });

        return response()->json(['message' => 'EN review log updated']);
    }
}
