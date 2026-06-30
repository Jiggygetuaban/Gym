<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sessions = $request->user()
            ->workoutSessions()
            ->latest('started_at_ms')
            ->get();

        return response()->json(['sessions' => $sessions]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:80'],
            'name' => ['required', 'string', 'max:255'],
            'templateId' => ['nullable', 'string', 'max:80'],
            'startedAt' => ['required', 'integer'],
            'finishedAt' => ['required', 'integer'],
            'duration' => ['required', 'integer', 'min:0'],
            'exercises' => ['present', 'array'],
            'totalVolume' => ['required', 'numeric', 'min:0'],
        ]);

        $session = $request->user()->workoutSessions()->updateOrCreate(
            ['client_id' => $data['id']],
            [
                'name' => $data['name'],
                'template_id' => $data['templateId'] ?? null,
                'started_at_ms' => $data['startedAt'],
                'finished_at_ms' => $data['finishedAt'],
                'duration' => $data['duration'],
                'exercises' => $data['exercises'],
                'total_volume' => $data['totalVolume'],
            ],
        );

        ActivityLogger::log($request, 'workout_session.saved', 'Workout session saved', [
            'session_id' => $data['id'],
            'name' => $data['name'],
            'duration' => $data['duration'],
            'total_volume' => $data['totalVolume'],
        ]);

        return response()->json(['session' => $session], 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $deleted = $request->user()
            ->workoutSessions()
            ->where('client_id', $id)
            ->delete();

        if ($deleted > 0) {
            ActivityLogger::log($request, 'workout_session.deleted', 'Workout session deleted', [
                'session_id' => $id,
            ]);
        }

        return response()->json(['message' => 'Session deleted']);
    }
}
