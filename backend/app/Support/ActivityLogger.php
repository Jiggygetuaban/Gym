<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class ActivityLogger
{
    public static function log(
        Request $request,
        string $action,
        string $description,
        array $metadata = [],
        ?User $user = null,
    ): void {
        ActivityLog::create([
            'user_id' => ($user ?? $request->user())?->id,
            'action' => $action,
            'description' => $description,
            'metadata' => empty($metadata) ? null : $metadata,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
