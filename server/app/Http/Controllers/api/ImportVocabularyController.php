<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\JpWord;
use App\Models\JpHanviet;
use App\Models\JpStroke;
use App\Models\JpContext;
use App\Models\JpExample;
use App\Models\JpExampleExercise;
use App\Models\JpExerciseChoice;


class ImportVocabularyController extends Controller
{
    public function importJP()
    {
        $filePath = database_path('data/data.json');
        $json = file_get_contents($filePath);
        $data = json_decode($json, true);
        $userId = 2; // Nếu có auth()->id() thì thay thế dòng này

        if (!is_array($data)) {
            return response()->json(['error' => 'Invalid JSON structure'], 422);
        }

        foreach ($data as $item) {
            // 1. jp_words
            $word = JpWord::create([
                'user_id' => $userId,
                'kanji' => $item['kanji'],
                'reading_hiragana' => $item['reading_hiragana'],
                'reading_romaji' => $item['reading_romaji'],
                'meaning_vi' => $item['meaning_vi'],
                'jlpt_level' => $item['jlpt_level'],
                'level' => $item['level'],
                'last_reviewed_at' => $item['last_reviewed_at'] ?? null,
                'next_review_at' => $item['next_review_at'] ?? null,
                'audio_url' => $item['audio_url'] ?? null,
            ]);

            // 2. jp_hanviet
            JpHanviet::create([
                'jp_word_id' => $word->id,
                'han_viet' => $item['han_viet'],
                'explanation' => $item['explanation'],
            ]);

            // 3. jp_strokes
            if (!empty($item['stroke_url'])) {
                JpStroke::create([
                    'jp_word_id' => $word->id,
                    'stroke_url' => $item['stroke_url'],
                ]);
            }

            // 4. jp_contexts
            if (!empty($item['contexts'])) {
                foreach ($item['contexts'] as $context) {
                    JpContext::create([
                        'jp_word_id' => $word->id,
                        'context_vi' => $context['context_vi'],
                        'highlight_line' => $context['highlight_line'] ?? '',
                        'context_jp' => $context['context_jp'] ?? '',
                        'context_hira' => $context['context_hira'] ?? '',
                        'context_romaji' => $context['context_romaji'] ?? '',
                    ]);
                }
            }

            // 5. jp_examples
            if (!empty($item['examples'])) {
                foreach ($item['examples'] as $example) {
                    $ex = JpExample::create([
                        'jp_word_id' => $word->id,
                        'sentence_jp' => $example['sentence_jp'],
                        'sentence_hira' => $example['sentence_hira'],
                        'sentence_romaji' => $example['sentence_romaji'],
                        'sentence_vi' => $example['sentence_vi'],
                    ]);

                    // 6. jp_example_exercises
                    if (!empty($item['quizzes'])) {
                        foreach ($item['quizzes'] as $quiz) {
                            $exercise = JpExampleExercise::create([
                                'example_id' => $ex->id,
                                'question_type' => $quiz['question_type'],
                                'question_text' => $quiz['question_text'],
                                'blank_position' => $quiz['blank_position'],
                                'answer_explanation' => $quiz['answer_explanation'],
                            ]);

                            // 7. jp_exercise_choices
                            if (!empty($quiz['choices'])) {
                                foreach ($quiz['choices'] as $choice) {
                                    JpExerciseChoice::create([
                                        'exercise_id' => $exercise->id,
                                        'content' => $choice['content'],
                                        'is_correct' => $choice['is_correct'],
                                    ]);
                                }
                            }
                        }
                    }
                }
            }
        }

        return response()->json(['message' => 'Import thành công từ file local']);
    }

}
