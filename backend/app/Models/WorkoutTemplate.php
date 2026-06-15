<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutTemplate extends Model
{
    protected $fillable = [
        'user_id',
        'client_id',
        'name',
        'exercises',
        'created_at_ms',
    ];

    protected function casts(): array
    {
        return [
            'exercises' => 'array',
            'created_at_ms' => 'integer',
        ];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->client_id,
            'name' => $this->name,
            'exercises' => $this->exercises,
            'createdAt' => $this->created_at_ms,
        ];
    }
}
