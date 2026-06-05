<?php

namespace App\Http\Controllers\Api;

use App\Models\UserPassage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPassageController extends \App\Http\Controllers\Controller
{
    /**
     * Display a listing of the user's passages.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $passages = $user->passages()->orderBy('created_at', 'desc')->get();

        return response()->json($passages);
    }

    /**
     * Store a newly created passage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'passage' => 'required|string',
            'translation' => 'required|string',
            'language' => 'required|string|max:10',
        ]);

        $user = $request->user();

        $passage = $user->passages()->create($validated);

        return response()->json($passage, 201);
    }

    /**
     * Update the specified passage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'passage' => 'sometimes|required|string',
            'translation' => 'sometimes|required|string',
            'language' => 'sometimes|required|string|max:10',
        ]);

        $user = $request->user();
        $passage = $user->passages()->findOrFail($id);

        $passage->update($validated);

        return response()->json($passage);
    }

    /**
     * Remove the specified passage.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $passage = $user->passages()->findOrFail($id);

        $passage->delete();

        return response()->json(['message' => 'Passage deleted successfully']);
    }
}
