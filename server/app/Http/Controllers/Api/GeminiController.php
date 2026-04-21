<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiController extends Controller
{
    private $availableModels = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-3-flash"
    ];

    private function getApiKey()
    {
        $key = env('GEMINI_API_KEY');
        if (!$key) {
            throw new \Exception('Gemini API key not configured.');
        }
        return $key;
    }

    private function generateContent($modelName, $prompt, $options = [])
    {
        $apiKey = $this->getApiKey();
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key={$apiKey}";

        $payload = [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ],
            'generationConfig' => array_merge([
                'temperature' => 0.7,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 1024,
            ], $options)
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post($url, $payload);

        if (!$response->successful()) {
            throw new \Exception("Gemini API Error ({$response->status()}): " . $response->body(), $response->status());
        }

        $result = $response->json();
        
        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('Invalid response structure from Gemini API');
        }

        return $result['candidates'][0]['content']['parts'][0]['text'];
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
            $text = $this->generateContent($modelName, $conversationContext);
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

        $modelIndex = 0;
        
        while ($modelIndex < count($this->availableModels)) {
            $modelName = $this->availableModels[$modelIndex];
            Log::info("Trying Gemini model: {$modelName} for analyzeWord");

            try {
                $text = $this->generateContent($modelName, $prompt, [
                    'responseMimeType' => 'application/json'
                ]);

                // Parse the JSON to ensure it is valid
                $json = json_decode($text, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \Exception("Gemini returned invalid JSON: " . json_last_error_msg());
                }

                return response()->json($json);
                
            } catch (\Exception $e) {
                // If 429 quota error, fall back to next model
                if ($e->getCode() == 429 || str_contains($e->getMessage(), '429') || str_contains($e->getMessage(), 'quota')) {
                    Log::warning("Model {$modelName} quota exceeded. Falling back to next model.", ['error' => $e->getMessage()]);
                    $modelIndex++;
                    continue;
                }
                
                // Other errors, throw them out to the client
                Log::error("Gemini API Error in analyzeWord with model {$modelName}: " . $e->getMessage());
                return response()->json(['message' => 'Lỗi kết nối Gemini: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'Tất cả các model đều đã hết hạn mức hôm nay.'], 429);
    }
}
