<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Validator;

$data = json_decode(file_get_contents('C:/Users/thanh/Desktop/ProjectWEb/dataJapan/100kanjicongso/b1.json'), true);
$item = $data[0];

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
    'topic'             => 'nullable|array',
    'topic.*'           => 'string|max:100',
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
    echo "Validation failed:\n";
    print_r($v->errors()->toArray());
} else {
    echo "Validation passed\n";
}
