<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GeminiController extends Controller
{
    private GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'history' => 'array',
            'language' => 'required|in:jp,en',
            'modelName' => 'required|string'
        ]);

        $message = $validated['message'];
        $history = $validated['history'] ?? [];
        $language = $validated['language'];
        $modelName = $validated['modelName'];

        if ($language === 'jp') {
            $systemPrompt = "You are a helpful Japanese language tutor. Your role is to:
- Help students practice Japanese conversation
- Correct grammar mistakes gently and explain them
- Suggest better vocabulary or more natural expressions
- Provide cultural context when appropriate
- Always respond in Japanese (unless the student needs an explanation in Vietnamese for complex grammar)
- Be encouraging and supportive
- Keep responses concise and focused on learning

When the user makes a mistake, gently correct it and explain why. Use examples to help them understand.";
        } else {
            $systemPrompt = "You are a helpful English language tutor. Your role is to:
- Help students practice English conversation
- Correct grammar mistakes gently and explain them
- Suggest better vocabulary or more natural expressions
- Provide cultural context when appropriate
- Always respond in English (unless the student needs an explanation in Vietnamese for complex grammar)
- Be encouraging and supportive
- Keep responses concise and focused on learning

When the user makes a mistake, gently correct it and explain why. Use examples to help them understand.";
        }

        $conversationContext = $systemPrompt . "\n\n";

        if (!empty($history)) {
            $conversationContext .= "Previous conversation:\n";
            foreach ($history as $msg) {
                $role = (isset($msg['role']) && $msg['role'] === 'user') ? 'Student' : 'Tutor';
                $content = $msg['content'] ?? '';
                $conversationContext .= "{$role}: {$content}\n";
            }
            $conversationContext .= "\n";
        }

        $conversationContext .= "Student: {$message}\n\nTutor:";

        try {
            $text = $this->gemini->generateContent($modelName, $conversationContext);
            return response()->json($text);
        } catch (\Exception $e) {
            Log::error("[GeminiController] Error in chat: " . $e->getMessage());
            return response()->json(['message' => 'Failed to get response from AI: ' . $e->getMessage()], 500);
        }
    }

    public function analyzeWord(Request $request)
    {
        $validated = $request->validate([
            'word' => 'required|string',
            'language' => 'required|in:jp,en',
        ]);

        $word = $validated['word'];
        $language = $validated['language'];

        if ($language === 'jp') {
            $prompt = "Bạn là từ điển Nhật-Việt. Phân tích từ: {$word}. 
        Trả về JSON bao gồm các trường: 
        reading_hiragana, reading_romaji, meaning_vi, han_viet, hanviet_explanation, context_vi, sentence_jp, sentence_hira, sentence_romaji, sentence_vi,
        và jlpt_level (chọn một trong các giá trị: N1, N2, N3, N4, N5 dựa trên độ khó của từ).";
        } else {
            $prompt = "Bạn là từ điển Anh-Việt. Phân tích từ: {$word}. 
        Trả về JSON bao gồm các trường: 
        ipa (phiên âm), meaning_vi (nghĩa), cefr_level (A1, A2, B1, B2, C1, C2), context_vi (ngữ cảnh tiếng Việt), 
        exampleEn (ví dụ ngắn tiếng Anh), exampleVi (dịch ví dụ ngắn),
        sentence_en (câu ví dụ dài có một chỗ trống ____), sentence_vi (dịch câu dài),
        answer_explanation (giải thích cho bài tập), correct_answer (từ đúng để điền vào chỗ trống).";
        }

        try {
            $json = $this->gemini->generateJsonWithFallback($prompt);
            return response()->json($json);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'hết hạn mức')) {
                return response()->json(['message' => $e->getMessage()], 429);
            }
            Log::error("Gemini API Error in analyzeWord: " . $e->getMessage());
            return response()->json(['message' => 'Lỗi kết nối Gemini: ' . $e->getMessage()], 500);
        }
    }
}
