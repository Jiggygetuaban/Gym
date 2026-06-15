<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AiSuggestionController;
use App\Http\Controllers\Api\WorkoutSessionController;
use App\Http\Controllers\Api\WorkoutTemplateController;
use App\Http\Middleware\BearerTokenAuth;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware(BearerTokenAuth::class)->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/profile/photo', [AuthController::class, 'uploadProfilePhoto']);
    Route::delete('/auth/profile/photo', [AuthController::class, 'removeProfilePhoto']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/ai/suggestions', [AiSuggestionController::class, 'store']);

    Route::get('/workout-templates', [WorkoutTemplateController::class, 'index']);
    Route::post('/workout-templates', [WorkoutTemplateController::class, 'store']);
    Route::delete('/workout-templates/{id}', [WorkoutTemplateController::class, 'destroy']);

    Route::get('/workout-sessions', [WorkoutSessionController::class, 'index']);
    Route::post('/workout-sessions', [WorkoutSessionController::class, 'store']);
    Route::delete('/workout-sessions/{id}', [WorkoutSessionController::class, 'destroy']);
});
