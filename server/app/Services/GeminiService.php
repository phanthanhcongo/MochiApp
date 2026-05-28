<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private array $availableModels = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
    ];

    /**
     * Get the Gemini API key from environment.
     */
    private function getApiKey(): string
    {
        $key = env('GEMINI_API_KEY');
        if (!$key) {
            throw new \Exception('Gemini API key not configured.');
        }
        return $key;
    }

    /**
     * Call the Gemini API to generate content.
     *
     * @param string $modelName  Model identifier (e.g. gemini-2.5-flash)
     * @param string $prompt     The text prompt
     * @param array  $options    Extra generationConfig overrides
     * @return string            Raw text output from the model
     */
    public function generateContent(string $modelName, string $prompt, array $options = []): string
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
            ], $options),
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if (!$response->successful()) {
            throw new \Exception(
                "Gemini API Error ({$response->status()}): " . $response->body(),
                $response->status()
            );
        }

        $result = $response->json();

        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('Invalid response structure from Gemini API');
        }

        return $result['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * Call Gemini with automatic model fallback on 429 quota errors.
     *
     * @param string $prompt   The text prompt
     * @param array  $options  Extra generationConfig overrides
     * @return string          Raw text output
     */
    public function generateWithFallback(string $prompt, array $options = []): string
    {
        foreach ($this->availableModels as $modelName) {
            try {
                Log::info("Trying Gemini model: {$modelName}");
                return $this->generateContent($modelName, $prompt, $options);
            } catch (\Exception $e) {
                if ($e->getCode() == 429 || str_contains($e->getMessage(), '429') || str_contains($e->getMessage(), 'quota')) {
                    Log::warning("Model {$modelName} quota exceeded. Falling back to next model.", ['error' => $e->getMessage()]);
                    continue;
                }
                throw $e;
            }
        }

        throw new \Exception('Tất cả các model đều đã hết hạn mức hôm nay.');
    }

    /**
     * Call Gemini with fallback and parse the result as JSON.
     *
     * @param string $prompt   The text prompt
     * @param array  $options  Extra generationConfig overrides
     * @return array           Parsed JSON
     */
    public function generateJsonWithFallback(string $prompt, array $options = []): array
    {
        $options['responseMimeType'] = 'application/json';
        $text = $this->generateWithFallback($prompt, $options);

        $json = json_decode($text, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Gemini returned invalid JSON: ' . json_last_error_msg());
        }

        return $json;
    }
}
