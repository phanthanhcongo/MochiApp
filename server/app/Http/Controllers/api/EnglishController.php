<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnglishService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EnglishController extends Controller
{
    protected $englishService;

    public function __construct(EnglishService $englishService)
    {
        $this->englishService = $englishService;
    }

    /**
     * Import vocabulary
     * Supports two formats:
     * 1. Array directly: [{word: "...", ...}, ...]
     * 2. Object with words key: {words: [{word: "...", ...}, ...]}
     */
    public function importVocabulary(Request $request)
    {
        // Get raw JSON body
        $payload = $request->json()->all();

        // Determine if payload is array directly or object with 'words' key
        $words = null;
        if (is_array($payload) && isset($payload[0]) && !isset($payload['words'])) {
            // Format 1: Array directly [ {...}, {...} ]
            $words = $payload;
        } elseif (isset($payload['words']) && is_array($payload['words'])) {
            // Format 2: Object with 'words' key { words: [...] }
            $words = $payload['words'];
        } else {
            return response()->json([
                'error'   => 'Payload không hợp lệ',
                'details' => 'Payload phải là mảng trực tiếp [ {...} ] hoặc object có key "words": { "words": [...] }',
            ], 422);
        }

        // Validate words array
        $validator = Validator::make(['words' => $words], [
            'words' => ['required', 'array', 'min:1'],
            'words.*.word'        => ['required', 'string'],
            'words.*.ipa'         => ['nullable', 'string'],
            'words.*.meaning_vi'  => ['required', 'string'],
            'words.*.cefr_level'  => ['nullable'],
            'words.*.level'       => ['nullable', 'integer'],
            'words.*.context_vi'  => ['nullable', 'string'],
            'words.*.is_grammar'  => ['nullable', 'boolean'],
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

        try {
            $result = $this->englishService->importVocabulary(
                $validator->validated()['words'],
                optional($request->user())->id
            );

            if (empty($result['committed'])) {
                return response()->json([
                    'error'      => 'Không có từ nào được thêm, toàn bộ đều trùng',
                    'duplicates' => $result['duplicates'],
                ], 409);
            }

            return response()->json([
                'message'    => 'Inserted successfully',
                'items'      => $result['committed'],
                'duplicates' => $result['duplicates'],
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('EN import failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
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
        try {
            return response()->json(
                $this->englishService->getStats($request->user()->id, now())
            );
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
        try {
            return response()->json(
                $this->englishService->getStatsGrammar($request->user()->id, now())
            );
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
        try {
            return response()->json([
                'allWords' => $this->englishService->getAllWords($request->user()->id),
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
     * Update reviewed words
     */
    public function updateReviewedWordsEn(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $reviewedWords = (array) $request->input('reviewedWords', []);
        if (empty($reviewedWords)) {
            return response()->json(['message' => 'Nothing to update'], 200);
        }

        try {
            $result = $this->englishService->updateReviewedWords(
                $reviewedWords,
                $request->user()->id
            );
            return response()->json([
                'message' => 'EN review log updated',
                'updated' => $result['updated'],
            ]);
        } catch (\Throwable $e) {
            \Log::error('updateReviewedWordsEn failed', [
                'user_id' => $request->user()->id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to update reviewed words',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store new words
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'words' => ['required', 'array', 'min:1'],
            'words.*.word' => ['required', 'string'],
            'words.*.ipa' => ['nullable', 'string'],
            'words.*.meaning_vi' => ['required', 'string'],
            'words.*.cefr_level' => ['nullable'],
            'words.*.level' => ['nullable', 'integer'],
            'words.*.context_vi' => ['nullable', 'string'],
            'words.*.is_active' => ['nullable', 'boolean'],
            'words.*.is_grammar' => ['nullable', 'boolean'],
            'words.*.exampleEn' => ['nullable', 'string'],
            'words.*.exampleVi' => ['nullable', 'string'],
            'words.*.examples' => ['nullable', 'array'],
            'words.*.examples.*.sentence_en' => ['required_with:words.*.examples', 'string'],
            'words.*.examples.*.sentence_vi' => ['nullable', 'string'],
            'words.*.examples.*.exercises' => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.question_text' => ['required_with:words.*.examples.*.exercises', 'string'],
            'words.*.examples.*.exercises.*.answer_explanation' => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.question_type' => ['nullable', 'string'],
            'words.*.examples.*.exercises.*.blank_position' => ['nullable'],
            'words.*.examples.*.exercises.*.choices' => ['nullable', 'array'],
            'words.*.examples.*.exercises.*.choices.*.content' => ['required_with:words.*.examples.*.exercises.*.choices', 'string'],
            'words.*.examples.*.exercises.*.choices.*.is_correct' => ['required_with:words.*.examples.*.exercises.*.choices', 'integer'],
        ]);

        try {
            return response()->json([
                'message' => 'Inserted successfully',
                'data'    => $this->englishService->storeWords(
                    $data['words'],
                    optional($request->user())->id
                ),
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Store words failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi thêm từ',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
    /**
     * Get all words with relations
     */
    public function index(Request $request)
    {
        try {
            $userId = optional($request->user())->id;
            return response()->json([
                'message' => 'Fetched all words successfully',
                'data' => $this->englishService->getAllWordsWithRelations($userId),
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Get all words failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi lấy danh sách từ',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
    /**
     * Delete a word
     */
    public function destroy($id, Request $request)
    {
        try {
            $this->englishService->deleteWord((int) $id, optional($request->user())->id);
            return response()->json([
                'message' => 'Deleted successfully',
                'id'      => (int) $id,
            ], 200);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (\Throwable $e) {
            \Log::error('Delete word failed', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Lỗi khi xóa từ',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
    /**
     * Get word by ID
     */
    public function getById(Request $request, $id)
    {
        try {
            $userId = optional($request->user())->id ?? $request->integer('user_id');
            $word = $this->englishService->getWordById((int) $id, $userId);

            return response()->json([
                'status'  => 'ok',
                'message' => 'Fetched successfully',
                'data'    => $word,
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\RuntimeException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], $e->getMessage() === 'Missing user_id' ? 400 : 404, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Throwable $e) {
            \Log::error('GET /en/practice/{id} failed', [
                'id'      => $id,
                'user_id' => optional($request->user())->id ?? $request->input('user_id'),
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Server error',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
    /**
     * Update words
     */
    public function update(Request $request, $id = null)
    {
        $data = $request->validate([
            'words' => ['required', 'array', 'min:1'],
            'words.*.id'          => ['required', 'integer', 'min:1'],
            'words.*.user_id'     => ['nullable', 'integer'],
            'words.*.word'        => ['required', 'string'],
            'words.*.ipa'         => ['nullable', 'string'],
            'words.*.meaning_vi'  => ['required', 'string'],
            'words.*.cefr_level'  => ['nullable', 'in:A1,A2,B1,B2,C1,C2'],
            'words.*.level'       => ['nullable', 'integer', 'min:1'],
            'words.*.last_reviewed_at' => ['nullable', 'date'],
            'words.*.next_review_at'   => ['nullable', 'date'],
            'words.*.context_vi'  => ['nullable', 'string'],
            'words.*.is_active'   => ['nullable', 'boolean'],
            'words.*.is_grammar'  => ['nullable', 'boolean'],
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

        try {
            return response()->json([
                'status'  => 'ok',
                'message' => 'Updated successfully',
                'data'    => $this->englishService->updateWords(
                    $data['words'],
                    optional($request->user())->id
                ),
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\RuntimeException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 404, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Throwable $e) {
            \Log::error('Update word failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Server error',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
}
