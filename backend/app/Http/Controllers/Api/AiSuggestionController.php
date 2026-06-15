<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiSuggestionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:workout,diet,general'],
            'prompt' => ['required', 'string', 'max:1200'],
        ]);

        $apiKey = config('services.groq.key');

        if (! $apiKey) {
            return response()->json([
                'error' => 'Groq API key is not configured on the backend.',
            ], 503);
        }

        $user = $request->user();
        $recentSessions = $user->workoutSessions()
            ->latest('started_at_ms')
            ->limit(5)
            ->get()
            ->map(fn ($session) => [
                'name' => $session->name,
                'duration_minutes' => round($session->duration / 60),
                'total_volume' => (float) $session->total_volume,
                'exercises' => collect($session->exercises)
                    ->pluck('exercise.name')
                    ->filter()
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        $templates = $user->workoutTemplates()
            ->latest('created_at_ms')
            ->limit(5)
            ->get()
            ->map(fn ($template) => [
                'name' => $template->name,
                'exercises' => collect($template->exercises)
                    ->pluck('exercise.name')
                    ->filter()
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        try {
            $response = Http::timeout(25)
                ->withToken($apiKey)
                ->acceptJson()
                ->post(rtrim(config('services.groq.base_url'), '/').'/chat/completions', [
                    'model' => config('services.groq.model'),
                    'temperature' => 0.6,
                    'max_tokens' => 700,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $this->systemPrompt(),
                        ],
                        [
                            'role' => 'user',
                            'content' => json_encode([
                                'request_type' => $data['type'],
                                'user_question' => $data['prompt'],
                                'recent_sessions' => $recentSessions,
                                'workout_templates' => $templates,
                            ], JSON_PRETTY_PRINT),
                        ],
                    ],
                ]);
        } catch (ConnectionException) {
            return response()->json([
                'error' => 'Could not reach Groq. Please try again.',
            ], 503);
        }

        if (! $response->successful()) {
            return response()->json([
                'error' => $response->json('error.message') ?? 'Groq request failed.',
            ], $response->status());
        }

        return response()->json([
            'suggestion' => $response->json('choices.0.message.content') ?? 'No suggestion was generated.',
            'model' => $response->json('model'),
        ]);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
You are a practical fitness coach inside a workout tracking app.
Give concise, actionable workout or nutrition suggestions based on the user's request and available workout history.
Use safe general guidance only: do not diagnose medical conditions, prescribe supplements or medications, or claim guaranteed results.
For diet requests, ask the user to consider allergies, medical conditions, and professional advice when relevant.
Format the answer with short sections and bullet points. Keep it under 220 words.
PROMPT;
    }
}
