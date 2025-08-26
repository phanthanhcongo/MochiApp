<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ImportVocabularyController;
use App\Http\Controllers\Api\PracticeStatsController;
use App\Http\Controllers\Api\PracticeController;
use App\Http\Controllers\Api\UserLanguageController;
use App\Http\Controllers\Api\EnglishController;
use App\Http\Controllers\Api\JapaneseController;

// Public
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me/language', [UserLanguageController::class, 'show']);

    //japanese
    Route::post('/me/language', [UserLanguageController::class, 'update']);
    Route::post('/auth/logout', [AuthController::class, 'logout']); // tùy chọn

    Route::post('/vocabulary/import', [ImportVocabularyController::class, 'importJP']);

    Route::get('/practice/stats', [PracticeStatsController::class, 'statsJP']);
    Route::get('/practice/listWord', [PracticeStatsController::class, 'getAllWordsJP']);

    Route::get('/practice/quiz', [PracticeController::class, 'getQuiz']);

    Route::post('/practice/reviewed-words', [JapaneseController::class, 'updateReviewedWords']);
    Route::post('/practice/add-word', [PracticeController::class, 'addWord']);
    Route::post('/practice/delete/{id}', [JapaneseController::class, 'destroy']);
    Route::post('/practice/updateWord/{id}', [PracticeController::class, 'updateWord']);



    //english
    Route::get('/en/practice/stats', [PracticeStatsController::class, 'statsEN']);
    Route::get('/en/practice/listWord', [PracticeStatsController::class, 'getAllWordsEN']);
    Route::post('/en/practice/reviewed-words', [EnglishController::class, 'updateReviewedWordsEn']);
    Route::post('/en/practice/addWord', [EnglishController::class, 'store']);
    Route::post('/en/practice/display', [EnglishController::class, 'index']);
Route::delete('/en/practice/delete/{id}', [EnglishController::class, 'destroy']);
Route::get('/en/practice/{id}', [EnglishController::class, 'getById']);
Route::post('/en/practice/update/{id}', [EnglishController::class, 'update']);
Route::post('/english/vocabulary/import', [ImportVocabularyController::class, 'importEnglish']);


});
