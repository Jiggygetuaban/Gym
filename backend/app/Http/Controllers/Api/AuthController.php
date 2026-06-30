<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetCodeMail;
use App\Models\ApiToken;
use App\Models\User;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);
        $data['role'] = User::ROLE_MEMBER;

        $user = User::create($data);

        ActivityLogger::log($request, 'auth.registered', 'Account created', [
            'email' => $user->email,
        ], $user);

        return $this->tokenResponse($user, 'Account created', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        ActivityLogger::log($request, 'auth.signed_in', 'Signed in', [], $user);

        return $this->tokenResponse($user, 'Signed in');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if ($user) {
            $code = (string) random_int(100000, 999999);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $data['email']],
                [
                    'token' => Hash::make($code),
                    'created_at' => now(),
                ],
            );

            Mail::to($user->email)->send(new PasswordResetCodeMail($code));

            ActivityLogger::log($request, 'auth.password_reset_requested', 'Password reset code requested', [
                'email' => $user->email,
            ], $user);
        }

        return response()->json([
            'message' => 'If that email exists, a reset code has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $reset = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if (
            ! $reset ||
            now()->diffInMinutes($reset->created_at) > 30 ||
            ! Hash::check($data['code'], $reset->token)
        ) {
            throw ValidationException::withMessages([
                'code' => ['The reset code is invalid or expired.'],
            ]);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account was found for this email.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->delete();

        $user->apiTokens()->delete();

        ActivityLogger::log($request, 'auth.password_reset', 'Password reset completed', [], $user);

        return response()->json([
            'message' => 'Password reset successfully. Please sign in.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $tokenId = $request->attributes->get('api_token_id');

        if ($tokenId) {
            ApiToken::whereKey($tokenId)->delete();
        }

        ActivityLogger::log($request, 'auth.signed_out', 'Signed out');

        return response()->json(['message' => 'Signed out']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'currentPassword' => ['nullable', 'required_with:password', 'string'],
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check($data['currentPassword'] ?? '', $user->password)) {
                throw ValidationException::withMessages([
                    'currentPassword' => ['The current password is incorrect.'],
                ]);
            }

            $user->password = $data['password'];
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->save();

        ActivityLogger::log($request, 'profile.updated', 'Profile updated');

        return response()->json([
            'message' => 'Profile updated',
            'user' => $user->fresh(),
        ]);
    }

    public function uploadProfilePhoto(Request $request): JsonResponse
    {
        $data = $request->validate([
            'photo' => ['required', 'image', 'max:4096'],
        ]);

        $user = $request->user();
        $this->deleteStoredProfilePhoto($user->profile_photo_url);

        $path = $data['photo']->store('profile-photos', 'public');
        $user->profile_photo_url = $request->getSchemeAndHttpHost().'/storage/'.$path;
        $user->save();

        ActivityLogger::log($request, 'profile.photo_uploaded', 'Profile photo uploaded');

        return response()->json([
            'message' => 'Profile photo updated',
            'user' => $user->fresh(),
        ]);
    }

    public function removeProfilePhoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->deleteStoredProfilePhoto($user->profile_photo_url);
        $user->profile_photo_url = null;
        $user->save();

        ActivityLogger::log($request, 'profile.photo_removed', 'Profile photo removed');

        return response()->json([
            'message' => 'Profile photo removed',
            'user' => $user->fresh(),
        ]);
    }

    private function deleteStoredProfilePhoto(?string $url): void
    {
        if (! $url) {
            return;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || ! str_starts_with($path, '/storage/')) {
            return;
        }

        Storage::disk('public')->delete(substr($path, strlen('/storage/')));
    }

    private function tokenResponse(User $user, string $message, int $status = 200): JsonResponse
    {
        $plainToken = bin2hex(random_bytes(32));

        $user->apiTokens()->create([
            'name' => 'mobile',
            'token_hash' => hash('sha256', $plainToken),
        ]);

        return response()->json([
            'message' => $message,
            'token' => $plainToken,
            'user' => $user,
        ], $status);
    }
}
