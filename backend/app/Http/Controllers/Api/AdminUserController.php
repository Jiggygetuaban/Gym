<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])
            ->orderBy('name')
            ->get();

        return response()->json(['users' => $users]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'string', Rule::in([User::ROLE_ADMIN, User::ROLE_MEMBER])],
        ]);

        if ($request->user()?->is($user) && $data['role'] !== User::ROLE_ADMIN) {
            return response()->json(['error' => 'You cannot remove your own admin access.'], 422);
        }

        $oldRole = $user->role;
        $user->forceFill(['role' => $data['role']])->save();

        ActivityLogger::log($request, 'admin.user_role_updated', 'User role updated', [
            'target_user_id' => $user->id,
            'target_email' => $user->email,
            'old_role' => $oldRole,
            'new_role' => $user->role,
        ]);

        return response()->json([
            'message' => 'User role updated',
            'user' => $user->fresh()->only([
                'id',
                'name',
                'email',
                'role',
                'created_at',
                'updated_at',
            ]),
        ]);
    }
}
