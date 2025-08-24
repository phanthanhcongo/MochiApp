<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserLanguageController extends  \App\Http\Controllers\Controller
{
    public function show(Request $request): JsonResponse
    {
        $lang = $request->user()->learning_language ?? 'jp';
        return response()->json(['language' => $lang]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate(['language' => 'required|in:jp,en']);
        $user = $request->user();
        $user->learning_language = $validated['language'];
        $user->save();
// TẠM THỜI log ra user id và learning_language
\Log::info('whoami', [
  'id' => optional($request->user())->id,
  'learning_language' => optional($request->user())->learning_language,
]);

        return response()->json(['language' => $user->learning_language]);
    }
}
