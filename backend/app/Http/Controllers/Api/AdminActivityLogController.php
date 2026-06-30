<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 50), 1), 100);

        $logs = ActivityLog::query()
            ->with('user:id,name,email')
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json(['logs' => $logs]);
    }
}
