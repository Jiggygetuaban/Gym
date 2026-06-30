<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
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
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.role', User::ROLE_MEMBER);

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

    public function test_only_admin_users_can_view_activity_logs(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'name' => 'Log Test',
            'email' => 'logs@example.com',
            'password' => 'secret123',
        ]);

        $token = $register->json('token');

        $this->withToken($token)
            ->postJson('/api/workout-templates', [
                'id' => 'log-template',
                'name' => 'Logged Template',
                'exercises' => [],
                'createdAt' => 1781517600000,
            ])
            ->assertCreated();

        $this->withToken($token)
            ->getJson('/api/admin/activity-logs')
            ->assertForbidden()
            ->assertJsonPath('error', 'Admin access required');

        User::where('email', 'logs@example.com')->update(['role' => User::ROLE_ADMIN]);

        $this->withToken($token)
            ->getJson('/api/admin/activity-logs')
            ->assertOk()
            ->assertJsonPath('logs.0.action', 'workout_template.saved')
            ->assertJsonPath('logs.0.user.email', 'logs@example.com')
            ->assertJsonPath('logs.0.metadata.template_id', 'log-template');
    }

    public function test_seeded_admin_user_can_login(): void
    {
        $this->seed();

        $this->postJson('/api/auth/login', [
            'email' => 'admin@gym.test',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Admin User')
            ->assertJsonPath('user.role', User::ROLE_ADMIN);
    }

    public function test_admin_can_list_users_and_update_user_roles(): void
    {
        $member = User::factory()->create([
            'name' => 'Member User',
            'email' => 'member@example.com',
            'role' => User::ROLE_MEMBER,
        ]);
        $admin = User::factory()->admin()->create([
            'email' => 'admin@example.com',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonFragment([
                'email' => 'admin@example.com',
                'role' => User::ROLE_ADMIN,
            ])
            ->assertJsonFragment([
                'email' => 'member@example.com',
                'role' => User::ROLE_MEMBER,
            ]);

        $this->withToken($token)
            ->patchJson("/api/admin/users/{$member->id}/role", [
                'role' => User::ROLE_ADMIN,
            ])
            ->assertOk()
            ->assertJsonPath('user.role', User::ROLE_ADMIN);

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'role' => User::ROLE_ADMIN,
        ]);
    }

    public function test_admin_cannot_remove_their_own_admin_role(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'self-admin@example.com',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $this->withToken($login->json('token'))
            ->patchJson("/api/admin/users/{$admin->id}/role", [
                'role' => User::ROLE_MEMBER,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('error', 'You cannot remove your own admin access.');
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
