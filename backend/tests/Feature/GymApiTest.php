<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use App\Mail\PasswordResetCodeMail;
use Tests\TestCase;

class GymApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_authenticate_and_manage_workout_data(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'name' => 'Codex Test',
            'email' => 'codex@example.com',
            'password' => 'secret123',
        ]);

        $register->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $token = $register->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'codex@example.com');

        $template = [
            'id' => 'tmpl-1',
            'name' => 'Push Day',
            'exercises' => [],
            'createdAt' => 1781517600000,
        ];

        $this->withToken($token)
            ->postJson('/api/workout-templates', $template)
            ->assertCreated()
            ->assertJsonPath('template.id', 'tmpl-1');

        $this->withToken($token)
            ->getJson('/api/workout-templates')
            ->assertOk()
            ->assertJsonPath('templates.0.name', 'Push Day');

        $session = [
            'id' => 'sess-1',
            'name' => 'Quick Workout',
            'templateId' => null,
            'startedAt' => 1781517600000,
            'finishedAt' => 1781518500000,
            'duration' => 900,
            'exercises' => [],
            'totalVolume' => 0,
        ];

        $this->withToken($token)
            ->postJson('/api/workout-sessions', $session)
            ->assertCreated()
            ->assertJsonPath('session.id', 'sess-1');

        $this->withToken($token)
            ->getJson('/api/workout-sessions')
            ->assertOk()
            ->assertJsonPath('sessions.0.duration', 900);
    }

    public function test_demo_user_can_login_and_has_seed_data(): void
    {
        $this->seed();

        $login = $this->postJson('/api/auth/login', [
            'email' => 'demo@gym.test',
            'password' => 'password',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.name', 'Demo User');

        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/workout-templates')
            ->assertOk()
            ->assertJsonPath('templates.0.id', 'demo-push-day');

        $this->withToken($token)
            ->getJson('/api/workout-sessions')
            ->assertOk()
            ->assertJsonPath('sessions.0.id', 'demo-session-push-day');
    }

    public function test_authenticated_user_can_request_ai_suggestion(): void
    {
        config(['services.groq.key' => 'test-key']);

        Http::fake([
            'api.groq.com/*' => Http::response([
                'model' => 'test-model',
                'choices' => [
                    [
                        'message' => [
                            'content' => "Try a push workout today.\n- Bench press\n- Overhead press",
                        ],
                    ],
                ],
            ]),
        ]);

        $register = $this->postJson('/api/auth/register', [
            'name' => 'AI Test',
            'email' => 'ai@example.com',
            'password' => 'secret123',
        ]);

        $this->withToken($register->json('token'))
            ->postJson('/api/ai/suggestions', [
                'type' => 'workout',
                'prompt' => 'What should I train today?',
            ])
            ->assertOk()
            ->assertJsonPath('suggestion', "Try a push workout today.\n- Bench press\n- Overhead press");
    }

    public function test_ai_suggestion_requires_groq_key(): void
    {
        config(['services.groq.key' => null]);

        $register = $this->postJson('/api/auth/register', [
            'name' => 'No Key Test',
            'email' => 'nokey@example.com',
            'password' => 'secret123',
        ]);

        $this->withToken($register->json('token'))
            ->postJson('/api/ai/suggestions', [
                'type' => 'diet',
                'prompt' => 'Suggest a diet.',
            ])
            ->assertStatus(503)
            ->assertJsonPath('error', 'Groq API key is not configured on the backend.');
    }

    public function test_user_can_reset_password_with_emailed_code(): void
    {
        Mail::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Reset Test',
            'email' => 'reset@example.com',
            'password' => 'oldpass',
        ])->assertCreated();

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'reset@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'If that email exists, a reset code has been sent.');

        Mail::assertSent(PasswordResetCodeMail::class, function (PasswordResetCodeMail $mail) {
            $this->assertMatchesRegularExpression('/^\d{6}$/', $mail->code);

            $this->postJson('/api/auth/reset-password', [
                'email' => 'reset@example.com',
                'code' => '000000',
                'password' => 'newpass',
                'password_confirmation' => 'newpass',
            ])->assertUnprocessable();

            $this->postJson('/api/auth/reset-password', [
                'email' => 'reset@example.com',
                'code' => $mail->code,
                'password' => 'newpass',
                'password_confirmation' => 'newpass',
            ])
                ->assertOk()
                ->assertJsonPath('message', 'Password reset successfully. Please sign in.');

            return true;
        });

        $this->postJson('/api/auth/login', [
            'email' => 'reset@example.com',
            'password' => 'oldpass',
        ])->assertUnprocessable();

        $this->postJson('/api/auth/login', [
            'email' => 'reset@example.com',
            'password' => 'newpass',
        ])->assertOk();
    }
}
