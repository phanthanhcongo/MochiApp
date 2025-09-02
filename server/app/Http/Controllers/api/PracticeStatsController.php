<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\JpWord;
use App\Models\JpDailyLog;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\EnWord;
use App\Models\EnDailyLog;

class PracticeStatsController extends \App\Http\Controllers\Controller
{
    // Thêm helper dùng chung (đặt trong controller hoặc tách service)
    private function computeStreakWithSelectiveCleanup(
        $dailyLogModel,
        int $userId,
        Carbon $now,
        bool $returnDetail = false,
        bool $cleanup = true
    ): int|array {
        // 0) Clone now để không mutate biến bên ngoài
        $cursor = $now->copy()->startOfDay();

        // 1) Dọn theo log sai mới nhất (nếu bật cleanup)
        if ($cleanup) {
            $latestFalse = $dailyLogModel::where('user_id', $userId)
                ->where('status', 0)
                ->orderByDesc('reviewed_at')
                ->first();

            if ($latestFalse) {
                $cutDate = Carbon::parse($latestFalse->reviewed_at)->toDateString();
                $dailyLogModel::where('user_id', $userId)
                    ->whereDate('reviewed_at', '<=', $cutDate)
                    ->delete();
            }
        }

        // 2) Lấy tất cả ngày học thành công (distinct, desc)
        $successDaysDesc = $dailyLogModel::where('user_id', $userId)
            ->where('status', 1)
            ->select(DB::raw('DATE(reviewed_at) as d'))
            ->orderByRaw('DATE(reviewed_at) DESC')
            ->pluck('d')
            ->toArray();

        if (empty($successDaysDesc)) {
            return $returnDetail ? ['count' => 0, 'dates' => []] : 0;
        }

        // Dùng set tra cứu O(1)
        // (array_fill_keys yêu cầu keys unique)
        $successDaysDesc = array_values(array_unique($successDaysDesc));
        $daySet = array_fill_keys($successDaysDesc, true);

        // 3) Nếu hôm nay chưa học, lùi về ngày học gần nhất <= hôm nay
        if (!isset($daySet[$cursor->toDateString()])) {
            $nearest = null;
            foreach ($successDaysDesc as $d) {
                if ($d <= $now->toDateString()) {
                    $nearest = $d;
                    break;
                }
            }
            if (!$nearest) {
                return $returnDetail ? ['count' => 0, 'dates' => []] : 0;
            }
            $cursor = Carbon::parse($nearest);
        }

        // 4) Đếm streak lùi theo ngày; chỉ cleanup khi đã đếm được >=1 ngày và gặp gap
        $streak = 0;
        $dates  = [];

        while (true) {
            $d = $cursor->toDateString();
            if (isset($daySet[$d])) {
                $streak++;
                $dates[] = $d;
                $cursor->subDay();
                continue;
            }

            if ($cleanup && $streak > 0) {
                // Xóa tất cả log <= ngày gap phát hiện
                $dailyLogModel::where('user_id', $userId)
                    ->whereDate('reviewed_at', '<=', $d)
                    ->delete();
            }
            break;
        }

        return $returnDetail ? ['count' => $streak, 'dates' => $dates] : $streak;
    }
    public function statsJP(Request $request)
    {
        $now = Carbon::now();
        $user = $request->user(); // ->id() có từ token
        $userId = $user->id;

        // 1. Thống kê số từ theo cấp độ (có lọc theo user)
        $reviewStats = JpWord::where('user_id', $userId)
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

        // 2. Tổng số từ (của user)
        $totalWords = JpWord::where('user_id', $userId)->count();

        // 3. Danh sách từ cần ôn (của user)
        $wordsToReviewList = JpWord::with([
            'hanviet',
            'contexts',
            'examples'
        ])
            ->where('user_id', $userId)
            ->where('next_review_at', '<=', $now)
            ->orderBy('next_review_at')
            ->get();

         // 4. Thời gian đến lần ôn gần nhất
        $now = Carbon::now();

        $nearestReviewTime = JpWord::where('user_id', $userId)
            ->where('next_review_at', '>', $now)
            ->min('next_review_at');
        $nextReviewIn = $nearestReviewTime
            ? Carbon::parse($nearestReviewTime)->diff($now)->format('%H:%I:%S')
            : null;
        \Log::info('nearestReviewTime', ['time' => $nearestReviewTime, 'nextReviewIn' => $nextReviewIn]);




        // 5. Tính streak thật sự (xử lý xoá các log false đúng cách)
        $streak = $this->computeStreakWithSelectiveCleanup(JpDailyLog::class, $userId, $now);



        return response()->json([
            'reviewStats' => $reviewStats,
            'totalWords' => $totalWords,
            'wordsToReview' => $wordsToReviewList->count(),
            'reviewWords' => $wordsToReviewList,
            'streak' => $streak,
            'nextReviewIn' => $nextReviewIn,
        ]);
    }
    public function getAllWordsJP(Request $request)
    {
        $user = $request->user(); // ->id() có từ token
        $userId = $user->id;
        $allWordsList = JpWord::with(['hanviet', 'contexts', 'examples'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'allWords'      => $allWordsList,
        ]);
    }
    public function statsEN(Request $request)
    {


        $now = Carbon::now();
        $userId = $request->user()->id;

        // 1. Thống kê số từ theo level
        $reviewStats = EnWord::where('user_id', $userId)
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
        $totalWords = EnWord::where('user_id', $userId)->count();

        // 3. Danh sách từ cần ôn
        $now = Carbon::now(); // hoặc Carbon::now('UTC')

        $wordsToReviewList = EnWord::with([
            'contexts',
            'examples.exercises.choices',
        ])
            ->where('user_id', $userId)
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<=', $now)   // ✨ chỉ lấy từ đã đến hạn
            ->orderBy('next_review_at')
            ->get();

        // 4. Thời gian đến lần ôn gần nhất
        $now = Carbon::now();

        $nearestReviewTime = EnWord::where('user_id', $userId)
            ->where('next_review_at', '>', $now)
            ->min('next_review_at');
        $nextReviewIn = $nearestReviewTime
            ? Carbon::parse($nearestReviewTime)->diff($now)->format('%H:%I:%S')
            : null;
        \Log::info('nearestReviewTime', ['time' => $nearestReviewTime, 'nextReviewIn' => $nextReviewIn]);


        // 5. Streak (xoá log sai)
        $streak = $this->computeStreakWithSelectiveCleanup(EnDailyLog::class, $userId, $now);


        return response()->json([
            'reviewStats' => $reviewStats,
            'totalWords' => $totalWords,
            'wordsToReview' => $wordsToReviewList->count(),
            'reviewWords' => $wordsToReviewList,
            'streak' => $streak,
            'nextReviewIn' => $nextReviewIn,
        ]);
    }

    public function getAllWordsEN(Request $request)
    {
        $userId = $request->user()->id;

        $allWordsList = EnWord::with(['contexts', 'examples', 'pronunciations'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'allWords' => $allWordsList,
        ]);
    }
}
