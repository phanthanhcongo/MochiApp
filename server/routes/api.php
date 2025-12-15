<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserLanguageController;
use App\Http\Controllers\Api\EnglishController;
use App\Http\Controllers\Api\JapaneseController;

// CORS Test Routes - Xóa sau khi test xong
Route::options('/test-cors', function () {
    return response()->json(['message' => 'CORS preflight OK'], 200);
});

Route::get('/test-cors', function () {
    return response()->json([
        'message' => 'CORS is working!',
        'timestamp' => now()->toDateTimeString(),
        'headers' => request()->headers->all(),
    ], 200);
});

Route::post('/test-cors', function () {
    return response()->json([
        'message' => 'CORS POST is working!',
        'data' => request()->all(),
        'timestamp' => now()->toDateTimeString(),
    ], 200);
});

// Test authentication route
Route::middleware('auth:sanctum')->get('/test-auth', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'message' => 'Authentication working!',
        'user' => [
            'id' => $request->user()->id,
            'name' => $request->user()->name,
        ],
        'token_present' => $request->bearerToken() ? 'yes' : 'no',
    ], 200);
});

// Public
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    // User language settings
    Route::get('/me/language', [UserLanguageController::class, 'show']);
    Route::post('/me/language', [UserLanguageController::class, 'update']);

    // User avatar settings
    Route::put('/me/avatar', [UserLanguageController::class, 'updateAvatar']);

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ========== Japanese Routes (prefix /jp) ==========
    Route::prefix('jp')->group(function () {
        // Vocabulary
        Route::post('/vocabulary/import', [JapaneseController::class, 'importVocabulary']);

        // Practice Stats
        Route::get('/practice/stats', [JapaneseController::class, 'getStats']);
        Route::get('/practice/stats-grammar', [JapaneseController::class, 'getStatsGrammar']);
        Route::get('/practice/listWord', [JapaneseController::class, 'getAllWords']);

        // Practice Words
        Route::post('/practice/reviewed-words', [JapaneseController::class, 'updateReviewedWords']);
        Route::post('/practice/add-word', [JapaneseController::class, 'addWord']);
        Route::post('/practice/updateWord/{id}', [JapaneseController::class, 'updateWord']);
        Route::post('/practice/delete/{id}', [JapaneseController::class, 'destroy']);
        Route::get('/practice/scenarios', [JapaneseController::class, 'getPracticeScenarios']);
    });

    // ========== English Routes (prefix /en) ==========
    Route::prefix('en')->group(function () {
        // Vocabulary
        Route::post('/vocabulary/import', [EnglishController::class, 'importVocabulary']);

        // Practice Stats
        Route::get('/practice/stats', [EnglishController::class, 'getStats']);
        Route::get('/practice/stats-grammar', [EnglishController::class, 'getStatsGrammar']);
        Route::get('/practice/listWord', [EnglishController::class, 'getAllWords']);

        // Practice Words
        Route::post('/practice/reviewed-words', [EnglishController::class, 'updateReviewedWordsEn']);
        Route::post('/practice/addWord', [EnglishController::class, 'store']);
        Route::post('/practice/display', [EnglishController::class, 'index']);
        Route::get('/practice/{id}', [EnglishController::class, 'getById']);
        Route::post('/practice/update/{id}', [EnglishController::class, 'update']);
        Route::delete('/practice/delete/{id}', [EnglishController::class, 'destroy']);
    });
});
