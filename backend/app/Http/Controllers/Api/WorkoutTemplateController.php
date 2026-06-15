<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $templates = $request->user()
            ->workoutTemplates()
            ->latest('created_at_ms')
            ->get();

        return response()->json(['templates' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:80'],
            'name' => ['required', 'string', 'max:255'],
            'exercises' => ['present', 'array'],
            'createdAt' => ['required', 'integer'],
        ]);

        $template = $request->user()->workoutTemplates()->updateOrCreate(
            ['client_id' => $data['id']],
            [
                'name' => $data['name'],
                'exercises' => $data['exercises'],
                'created_at_ms' => $data['createdAt'],
            ],
        );

        return response()->json(['template' => $template], 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()
            ->workoutTemplates()
            ->where('client_id', $id)
            ->delete();

        return response()->json(['message' => 'Template deleted']);
    }
}
