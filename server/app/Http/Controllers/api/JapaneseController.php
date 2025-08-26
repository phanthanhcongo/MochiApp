<?php

namespace App\Http\Controllers\Api;
use Illuminate\Support\Carbon;
use App\Models\JpDailyLog;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\JpWord;

class JapaneseController extends Controller
{
    /**
     * Xoá một từ JP theo id.
     */
    public function destroy($id)
    {
        $userId = Auth::id() ?? 2;

        // tìm từ theo id + user_id để tránh xoá nhầm của user khác
        $word = JpWord::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$word) {
            return response()->json([
                'error' => 'Không tìm thấy từ vựng cần xoá'
            ], 404);
        }

        // Xoá kèm quan hệ con (nếu đã setup cascade trong DB thì chỉ cần $word->delete())
        try {
            $word->delete();

            return response()->json([
                'message' => 'Xoá từ vựng thành công',
                'id'      => $id,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'Xoá thất bại',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
    public function updateReviewedWords(Request $request)
    {
        $userId = $request->user()->id;
        $items = (array) $request->input('reviewedWords', []);
        $tz = config('app.timezone', 'Asia/Bangkok');

        $anyUpdated = false;

        foreach ($items as $log) {
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

            // Ép bool an toàn cho firstFailed
            $firstFailed = filter_var(data_get($log, 'firstFailed'), FILTER_VALIDATE_BOOLEAN);

            // Parse reviewedAt với fallback về now()
            $reviewedAtRaw = data_get($log, 'reviewedAt');
            try {
                $reviewedAt = $reviewedAtRaw ? Carbon::parse($reviewedAtRaw, $tz) : now($tz);
            } catch (\Throwable $e) {
                $reviewedAt = now($tz);
            }

            $currentLevel = max(1, (int) ($jpWord->level ?? 1));

            if ($firstFailed) {
                // Sai: lùi 1 cấp (tối thiểu 1) và hẹn gần hơn bảng chuẩn
                // Sai: lùi 1 cấp (tối thiểu 1) và hẹn ôn LẬP TỨC
                $newLevel = max(1, $currentLevel - 1);

                // Nếu logic lấy lịch dùng where('next_review_at', '<=', now()) thì giữ nguyên như dưới
                // Nếu dùng so sánh nghiêm ngặt '<', nên đổi sang addSecond(1)
                $nextReviewAt = $reviewedAt->addSecond(5);
            } else {
                // Đúng: tăng 1 cấp (tối đa 7) và hẹn theo bảng chuẩn
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
            }

            $jpWord->update([
                'level' => $newLevel,
                'last_reviewed_at' => $reviewedAt,
                'next_review_at' => $nextReviewAt,
            ]);

            $anyUpdated = true;
        }

        // Ghi daily log 1 lần duy nhất nếu có cập nhật
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
                // Nếu đã true rồi → không làm gì
            });
        }

        return response()->json(['message' => 'Review log updated']);
    }
}
