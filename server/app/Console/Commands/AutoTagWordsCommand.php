<?php

namespace App\Console\Commands;

use App\Models\EnWord;
use App\Models\JpWord;
use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoTagWordsCommand extends Command
{
    protected $signature = 'words:auto-tag
                            {--language=both : Language to process (en, jp, or both)}
                            {--limit=0 : Max words to process (0 = unlimited)}
                            {--chunk=20 : Number of words per Gemini API call}
                            {--sleep=10 : Seconds to wait between chunks to avoid rate limit}
                            {--dry-run : Preview without saving to database}';

    protected $description = 'Auto-tag words with topics using Gemini AI';

    private const SUGGESTED_TOPICS = [
        'Daily Life', 'Food & Drink', 'Shopping', 'Home', 'Clothing',
        'Business', 'Work', 'Education', 'Technology', 'Finance',
        'Travel', 'Greeting', 'Family', 'Culture', 'Religion',
        'Health', 'Sports', 'Emotions', 'Nature', 'Animals', 'Science',
        'Entertainment', 'Hobbies', 'Art', 'Grammar', 'Idioms', 'Slang',
        'Keigo', 'Onomatopoeia',
    ];

    public function handle(GeminiService $gemini): int
    {
        $language = $this->option('language');
        $limit = (int) $this->option('limit');
        $chunkSize = (int) $this->option('chunk');
        $sleepDuration = (int) $this->option('sleep');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('🔍 DRY-RUN MODE — không có gì được lưu vào database.');
        }

        $totalUpdated = 0;

        if ($language === 'en' || $language === 'both') {
            $totalUpdated += $this->processLanguage('en', $gemini, $limit, $chunkSize, $sleepDuration, $dryRun);
        }

        if ($language === 'jp' || $language === 'both') {
            if ($limit > 0) {
                $remaining = max(0, $limit - $totalUpdated);
                if ($remaining === 0) {
                    $this->info("  ⏩ Đã đạt giới hạn {$limit} từ, bỏ qua Japanese.");
                } else {
                    $totalUpdated += $this->processLanguage('jp', $gemini, $remaining, $chunkSize, $sleepDuration, $dryRun);
                }
            } else {
                $totalUpdated += $this->processLanguage('jp', $gemini, 0, $chunkSize, $sleepDuration, $dryRun);
            }
        }

        $this->newLine();
        $this->info("✅ Hoàn tất! Tổng cộng {$totalUpdated} từ đã được gán nhãn.");

        return self::SUCCESS;
    }

    private function processLanguage(string $lang, GeminiService $gemini, int $limit, int $chunkSize, int $sleepDuration, bool $dryRun): int
    {
        $label = $lang === 'en' ? 'English' : 'Japanese';
        $this->newLine();
        $this->info("═══ Processing {$label} words ═══");

        // Query words with no topic
        $query = $lang === 'en'
            ? EnWord::whereNull('topic')->orWhere('topic', '[]')
            : JpWord::whereNull('topic')->orWhere('topic', '[]');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $words = $query->get();

        if ($words->isEmpty()) {
            $this->info("  ✓ Tất cả từ {$label} đã được gán nhãn rồi!");
            return 0;
        }

        $this->info("  Tìm thấy {$words->count()} từ chưa có topic.");

        $chunks = $words->chunk($chunkSize);
        $updated = 0;
        $chunkIndex = 0;

        foreach ($chunks as $chunk) {
            $chunkIndex++;
            $this->info("  📦 Chunk {$chunkIndex}/{$chunks->count()} ({$chunk->count()} từ)...");

            try {
                $results = $this->classifyChunk($chunk, $lang, $gemini);

                foreach ($results as $result) {
                    $id = $result['id'] ?? null;
                    $topics = $result['topic'] ?? [];

                    if (!$id || empty($topics)) continue;

                    $word = $chunk->firstWhere('id', $id);
                    if (!$word) continue;

                    // Display info
                    $wordLabel = $lang === 'en' ? $word->word : $word->kanji;
                    $topicsStr = implode(', ', $topics);

                    if ($dryRun) {
                        $this->line("    [DRY] {$wordLabel} → [{$topicsStr}]");
                    } else {
                        $word->topic = $topics;
                        $word->save();
                        $this->line("    ✓ {$wordLabel} → [{$topicsStr}]");
                    }

                    $updated++;
                }
            } catch (\Exception $e) {
                $this->error("    ✗ Lỗi chunk {$chunkIndex}: {$e->getMessage()}");
                Log::error("[AutoTag] Chunk {$chunkIndex} error: " . $e->getMessage());

                // If rate limited, wait and retry
                if (str_contains($e->getMessage(), '429') || str_contains($e->getMessage(), 'quota') || str_contains($e->getMessage(), 'hết hạn mức')) {
                    $this->warn("    ⏳ Rate limited. Dừng xử lý {$label}.");
                    break;
                }
            }

            // Small delay between chunks to avoid rate limiting
            if ($chunkIndex < $chunks->count()) {
                $this->info("    ⏳ Waiting {$sleepDuration}s before next chunk...");
                sleep($sleepDuration);
            }
        }

        $this->info("  → Đã gán nhãn {$updated}/{$words->count()} từ {$label}.");

        return $updated;
    }

    private function classifyChunk($chunk, string $lang, GeminiService $gemini): array
    {
        $topicList = implode(', ', self::SUGGESTED_TOPICS);

        if ($lang === 'en') {
            $wordLines = $chunk->map(fn($w) => "- id:{$w->id} | word: {$w->word} | meaning_vi: {$w->meaning_vi}")->implode("\n");
        } else {
            $wordLines = $chunk->map(fn($w) => "- id:{$w->id} | kanji: {$w->kanji} | meaning_vi: {$w->meaning_vi}")->implode("\n");
        }

        $prompt = <<<PROMPT
Bạn là hệ thống phân loại từ vựng. Hãy phân loại TỪNG từ dưới đây vào 1-2 topic phù hợp nhất.

DANH SÁCH TOPIC cho phép: [{$topicList}]

DANH SÁCH TỪ CẦN PHÂN LOẠI:
{$wordLines}

QUY TẮC:
- Mỗi từ chọn TỐI ĐA 2 topic phù hợp nhất từ danh sách trên.
- Nếu không topic nào phù hợp, chọn "Daily Life".
- Trả về ĐÚNG format JSON array, ví dụ:
[{"id": 1, "topic": ["Business", "Finance"]}, {"id": 2, "topic": ["Food & Drink"]}]

Chỉ trả về JSON, không giải thích gì thêm.
PROMPT;

        return $gemini->generateJsonWithFallback($prompt, [
            'maxOutputTokens' => 4096,
            'temperature' => 0.3,
        ]);
    }
}
