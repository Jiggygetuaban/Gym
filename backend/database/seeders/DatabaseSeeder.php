<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@gym.test'],
            [
                'name' => 'Admin User',
                'role' => User::ROLE_ADMIN,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $user = User::updateOrCreate(
            ['email' => 'demo@gym.test'],
            [
                'name' => 'Demo User',
                'role' => User::ROLE_MEMBER,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $pushExercises = [
            [
                'id' => 'demo-active-bench',
                'exercise' => [
                    'id' => 'bench-press',
                    'name' => 'Bench Press',
                    'category' => 'Chest',
                    'equipment' => 'Barbell',
                ],
                'sets' => [
                    ['reps' => '8', 'weight' => '60', 'completed' => false],
                    ['reps' => '8', 'weight' => '65', 'completed' => false],
                    ['reps' => '6', 'weight' => '70', 'completed' => false],
                ],
            ],
            [
                'id' => 'demo-active-press',
                'exercise' => [
                    'id' => 'overhead-press',
                    'name' => 'Overhead Press',
                    'category' => 'Shoulders',
                    'equipment' => 'Barbell',
                ],
                'sets' => [
                    ['reps' => '8', 'weight' => '35', 'completed' => false],
                    ['reps' => '8', 'weight' => '37.5', 'completed' => false],
                    ['reps' => '6', 'weight' => '40', 'completed' => false],
                ],
            ],
        ];

        $user->workoutTemplates()->updateOrCreate(
            ['client_id' => 'demo-push-day'],
            [
                'name' => 'Demo Push Day',
                'exercises' => $pushExercises,
                'created_at_ms' => now()->subDays(14)->valueOf(),
            ],
        );

        $completedExercises = $pushExercises;
        $completedExercises[0]['sets'] = [
            ['reps' => '8', 'weight' => '60', 'completed' => true],
            ['reps' => '8', 'weight' => '65', 'completed' => true],
            ['reps' => '6', 'weight' => '70', 'completed' => true],
        ];
        $completedExercises[1]['sets'] = [
            ['reps' => '8', 'weight' => '35', 'completed' => true],
            ['reps' => '8', 'weight' => '37.5', 'completed' => true],
            ['reps' => '6', 'weight' => '40', 'completed' => true],
        ];

        $startedAt = now()->subDays(2)->setTime(18, 30)->valueOf();

        $user->workoutSessions()->updateOrCreate(
            ['client_id' => 'demo-session-push-day'],
            [
                'name' => 'Demo Push Day',
                'template_id' => 'demo-push-day',
                'started_at_ms' => $startedAt,
                'finished_at_ms' => $startedAt + 52 * 60 * 1000,
                'duration' => 52 * 60,
                'exercises' => $completedExercises,
                'total_volume' => 2220,
            ],
        );
    }
}
