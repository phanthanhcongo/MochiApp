<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserLanguageController extends  \App\Http\Controllers\Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
            'target_language' => $user->learning_language ?? 'jp',
            'language' => $user->learning_language ?? 'jp', // Keep for backward compatibility
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate(['language' => 'required|in:jp,en']);
        $user = $request->user();
        $user->learning_language = $validated['language'];
        $user->save();

        return response()->json(['language' => $user->learning_language]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar_url' => 'required|url|max:500',
        ]);

        $user = $request->user();
        $user->avatar_url = $validated['avatar_url'];
        $user->save();

        return response()->json([
            'message' => 'Avatar updated successfully',
            'avatar_url' => $user->avatar_url,
        ]);
    }
}
