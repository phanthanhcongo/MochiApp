<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JpWord;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HandlePracticeController extends Controller
{
    /**
     * Lấy 100 từ đã đến thời gian ôn và tạo danh sách kịch bản luyện tập
     * Mỗi kịch bản bao gồm: order (thứ tự), word (thông tin từ), quizType
     */
    public function getPracticeScenarios(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $userId = $user->id;
            $now = Carbon::now();

            // Lấy 100 từ đã đến thời gian ôn
            $words = JpWord::with(['hanviet', 'examples'])
                ->where('user_id', $userId)
                ->where('next_review_at', '<=', $now)
                ->orderBy('next_review_at')
                ->limit(5)
                ->get();

            if ($words->isEmpty()) {
                return response()->json([
                    'message' => 'Không có từ nào cần ôn tập',
                    'scenarios' => []
                ], 200);
            }

            $scenarios = [];
            $wordCount = $words->count();
            $previousQuizType = null;

            // Tạo kịch bản cho từng từ với thứ tự và quizType
            foreach ($words as $index => $word) {
                try {
                    // Xác định quizType với validation (skip stroke check để tránh timeout)
                    // Đảm bảo quizType khác với từ trước đó
                    $quizType = $this->determineQuizType($word, false, $previousQuizType);

                    $scenarios[] = [
                        'order' => $index + 1, // Thứ tự bắt đầu từ 1
                        'word' => $this->formatWord($word),
                        'quizType' => $quizType,
                    ];

                    // Lưu quizType hiện tại để so sánh với từ tiếp theo
                    $previousQuizType = $quizType;
                } catch (\Exception $e) {
                    Log::error('Error processing word', [
                        'word_id' => $word->id,
                        'error' => $e->getMessage(),
                    ]);
                    // Skip word này và tiếp tục
                    continue;
                }
            }

            return response()->json([
                'message' => 'Lấy danh sách kịch bản luyện tập thành công',
                'totalWords' => $wordCount,
                'scenarios' => $scenarios,
            ], 200);
        } catch (\Exception $e) {
            Log::error('getPracticeScenarios error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Lỗi khi lấy danh sách kịch bản',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Xác định quizType dựa trên validation:
     * - Nếu không có strokeData (từ CDN) → không được match với multiCharStrokePractice
     * - Nếu không có kanji → không được match với hiraganaPractice
     * - Đảm bảo quizType khác với previousQuizType (nếu có)
     *
     * @param bool $checkStrokeData Nếu false, sẽ skip check stroke data để tránh timeout
     * @param string|null $previousQuizType QuizType của từ trước đó để tránh trùng lặp
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

        // Kiểm tra có kanji không (ít nhất 1 ký tự Han)
        $hasKanji = $this->containsKanji($word->kanji);

        // Kiểm tra có stroke data từ CDN không (chỉ khi được yêu cầu)
        $hasStrokeData = false;
        if ($checkStrokeData) {
            try {
                $hasStrokeData = $this->canStrokeWordCN($word->kanji);
            } catch (\Exception $e) {
                // Nếu lỗi khi check stroke data, giả sử không có
                Log::warning('Error checking stroke data', [
                    'word_id' => $word->id,
                    'error' => $e->getMessage(),
                ]);
                $hasStrokeData = false;
            }
        }

        // Bắt đầu với pool đầy đủ
        $availableTypes = $allQuizTypes;

        // Nếu không có stroke data, loại bỏ multiCharStrokePractice
        if (!$hasStrokeData) {
            $availableTypes = array_filter($availableTypes, function ($type) {
                return $type !== 'multiCharStrokePractice';
            });
        }

        // Nếu không có kanji, loại bỏ hiraganaPractice
        if (!$hasKanji) {
            $availableTypes = array_filter($availableTypes, function ($type) {
                return $type !== 'hiraganaPractice';
            });
        }

        // Loại bỏ previousQuizType nếu có và còn ít nhất 1 type khác
        if ($previousQuizType !== null) {
            $availableTypes = array_filter($availableTypes, function ($type) use ($previousQuizType) {
                return $type !== $previousQuizType;
            });
        }

        // Chuyển về array
        $availableTypes = array_values($availableTypes);

        // Nếu sau khi loại bỏ previousQuizType mà không còn type nào,
        // thì quay lại dùng tất cả types hợp lệ (trừ previousQuizType nếu có thể)
        if (empty($availableTypes)) {
            // Reset lại availableTypes với tất cả types hợp lệ
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

            // Nếu vẫn không có type nào, return null
            if (empty($availableTypes)) {
                return null;
            }

            // Nếu chỉ còn 1 type và nó trùng với previousQuizType, vẫn phải dùng nó
            // (trường hợp đặc biệt khi chỉ có 1 type hợp lệ)
            if (count($availableTypes) === 1 && $availableTypes[0] === $previousQuizType) {
                return $availableTypes[0];
            }

            // Loại bỏ previousQuizType một lần nữa nếu có thể
            if ($previousQuizType !== null) {
                $availableTypes = array_filter($availableTypes, function ($type) use ($previousQuizType) {
                    return $type !== $previousQuizType;
                });
                $availableTypes = array_values($availableTypes);
            }
        }

        if (empty($availableTypes)) {
            return null; // Không có type nào hợp lệ
        }

        return $availableTypes[array_rand($availableTypes)];
    }

    /**
     * Kiểm tra chuỗi có chứa ít nhất 1 ký tự Kanji (Han script)
     */
    private function containsKanji(?string $text): bool
    {
        if (empty($text)) {
            return false;
        }

        // PHP hỗ trợ Unicode property escapes với flag 'u'
        // \p{Han} hoặc \p{Script=Han} để match chữ Hán
        return preg_match('/\p{Han}/u', $text) === 1;
    }

    /**
     * Kiểm tra một ký tự Han có stroke data trên CDN không
     */
    private function hasStrokeDataForChar(string $char): bool
    {
        static $cache = [];

        // Kiểm tra cache trước
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
            // Nếu lỗi (404, timeout, etc.) → không có stroke data
            $cache[$char] = false;
            return false;
        }
    }

    /**
     * Kiểm tra một từ có thể vẽ stroke được không
     * - TRUE khi trong từ có ÍT NHẤT 1 ký tự Hán và
     *   TẤT CẢ các ký tự Hán đó đều có dataset trên CDN
     * - Tương tự logic canStrokeWordCN trong frontend
     */
    private function canStrokeWordCN(?string $word): bool
    {
        if (empty($word)) {
            return false;
        }

        // Normalize và trim
        $text = trim($word);
        if (empty($text)) {
            return false;
        }

        // Lấy tất cả ký tự Han (unique)
        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);
        $hanChars = [];

        foreach ($chars as $char) {
            if ($this->containsKanji($char)) {
                $hanChars[$char] = true; // Dùng key để tự động unique
            }
        }

        $hanChars = array_keys($hanChars);

        // Nếu không có Kanji → không vào stroke
        if (empty($hanChars)) {
            return false;
        }

        // Kiểm tra TẤT CẢ ký tự Han đều có stroke data
        foreach ($hanChars as $char) {
            if (!$this->hasStrokeDataForChar($char)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Format word để trả về frontend
     * Chỉ trả về các thuộc tính cần thiết theo interface JpReviewWord
     */
    private function formatWord(JpWord $word): array
    {
        try {
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
        } catch (\Exception $e) {
            Log::error('Error formatting word', [
                'word_id' => $word->id ?? null,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}

