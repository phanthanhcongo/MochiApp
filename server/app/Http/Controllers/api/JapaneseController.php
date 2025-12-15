<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\JapaneseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class JapaneseController extends Controller
{
    protected $japaneseService;

    public function __construct(JapaneseService $japaneseService)
    {
        $this->japaneseService = $japaneseService;
    }
    /**
     * Import vocabulary
     */
    public function importVocabulary(Request $request)
    {
        $payload = $request->json()->all();
        $items = isset($payload['data']) ? $payload['data'] : $payload;

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
                'is_grammar'        => 'nullable|string',
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

        try {
            $result = $this->japaneseService->importVocabulary($items, $userId);

            if (empty($result['committed'])) {
                return response()->json([
                    'error'      => 'Không có từ nào được thêm, toàn bộ đều trùng',
                    'duplicates' => $result['duplicates'],
                ], 409);
            }

            return response()->json([
                'message'    => 'Import thành công',
                'items'      => $result['committed'],
                'duplicates' => $result['duplicates'],
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('JP Import failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'error'   => 'Import thất bại, đã rollback',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get practice stats
     */
    public function getStats(Request $request)
    {
        $userId = $request->user()->id;
        $now = Carbon::now();

        try {
            $stats = $this->japaneseService->getStats($userId, $now);
            return response()->json($stats);
        } catch (\Throwable $e) {
            \Log::error('Get stats failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get grammar stats
     */
    public function getStatsGrammar(Request $request)
    {
        $userId = $request->user()->id;
        $now = Carbon::now();

        try {
            $stats = $this->japaneseService->getStatsGrammar($userId, $now);
            return response()->json($stats);
        } catch (\Throwable $e) {
            \Log::error('Get grammar stats failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê ngữ pháp',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all words
     */
    public function getAllWords(Request $request)
    {
        $userId = $request->user()->id;

        try {
            $words = $this->japaneseService->getAllWords($userId);
            return response()->json([
                'allWords' => $words,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Get all words failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi lấy danh sách từ',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Add a word
     */
    public function addWord(Request $request)
    {
        $data = $request->validate([
            'kanji'            => 'required|string|max:255',
            'reading_hiragana' => 'nullable|string|max:255',
            'reading_romaji'   => 'nullable|string|max:255',
            'meaning_vi'       => 'nullable|string',
            'jlpt_level'       => ['nullable', 'string', \Illuminate\Validation\Rule::in(['N1', 'N2', 'N3', 'N4', 'N5'])],
            'level'            => 'nullable|integer|min:1|max:7',
            'han_viet'            => 'nullable|string|max:255',
            'hanviet_explanation' => 'nullable|string',
            'context_vi'          => 'nullable|string',
            'sentence_jp'     => 'nullable|string',
            'sentence_hira'   => 'nullable|string',
            'sentence_romaji' => 'nullable|string',
            'sentence_vi'     => 'nullable|string',
            'is_grammar'      => 'nullable|boolean',
            'is_active'      => 'nullable|boolean',
        ]);

        $userId = $request->user()->id;

        try {
            $word = $this->japaneseService->addWord($data, $userId);
            return response()->json([
                'message' => 'Thêm từ vựng thành công',
                'word_id' => $word->id
            ]);
        } catch (\Throwable $e) {
            \Log::error('Add word failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi thêm từ vựng',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update a word
     */
    public function updateWord(Request $request, $id)
    {
        $data = $request->validate([
            'kanji'            => 'nullable|string|max:255',
            'reading_hiragana' => 'nullable|string|max:255',
            'reading_romaji'   => 'nullable|string|max:255',
            'meaning_vi'       => 'nullable|string',
            'jlpt_level'       => ['nullable', 'string', \Illuminate\Validation\Rule::in(['N1', 'N2', 'N3', 'N4', 'N5'])],
            'level'            => 'nullable|integer|min:1|max:7',
            'is_grammar'       => 'nullable|boolean',
            'is_active'        => 'nullable|boolean',
            'han_viet'            => 'nullable|string|max:255',
            'hanviet_explanation' => 'nullable|string',
            'context_vi'          => 'nullable|string',
            'sentence_jp'     => 'nullable|string',
            'sentence_hira'   => 'nullable|string',
            'sentence_romaji' => 'nullable|string',
            'sentence_vi'     => 'nullable|string',
        ]);

        $userId = $request->user()->id;

        try {
            $word = $this->japaneseService->updateWord($id, $data, $userId);
            return response()->json([
                'message' => 'Cập nhật từ vựng thành công',
                'word_id' => $word->id,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Không tìm thấy từ của người dùng'], 404);
        } catch (\Throwable $e) {
            \Log::error('Update word failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi cập nhật từ vựng',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete a word
     */
    public function destroy($id)
    {
        $userId = Auth::id() ?? 2;

        try {
            $this->japaneseService->deleteWord($id, $userId);
            return response()->json([
                'message' => 'Xoá từ vựng thành công',
                'id'      => $id,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Không tìm thấy từ vựng cần xoá'
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'Xoá thất bại',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update reviewed words
     */
    public function updateReviewedWords(Request $request)
    {
        $userId = $request->user()->id;
        $reviewedWords = (array) $request->input('reviewedWords', []);

        try {
            $result = $this->japaneseService->updateReviewedWords($reviewedWords, $userId);
            return response()->json(['message' => 'Review log updated']);
        } catch (\Throwable $e) {
            \Log::error('Update reviewed words failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi cập nhật từ đã ôn',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get practice scenarios
     */
    public function getPracticeScenarios(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $userId = $user->id;
        $now = Carbon::now();

        try {
            $result = $this->japaneseService->getPracticeScenarios($userId, $now);

            if ($result['totalWords'] === 0) {
                return response()->json([
                    'message' => 'Không có từ nào cần ôn tập',
                    'scenarios' => []
                ], 200);
            }

            return response()->json([
                'message' => 'Lấy danh sách kịch bản luyện tập thành công',
                'totalWords' => $result['totalWords'],
                'scenarios' => $result['scenarios'],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('getPracticeScenarios error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Lỗi khi lấy danh sách kịch bản',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
