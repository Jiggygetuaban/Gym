<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutSession extends Model
{
    protected $fillable = [
        'user_id',
        'client_id',
        'name',
        'template_id',
        'started_at_ms',
        'finished_at_ms',
        'duration',
        'exercises',
        'total_volume',
    ];

    protected function casts(): array
    {
        return [
            'started_at_ms' => 'integer',
            'finished_at_ms' => 'integer',
            'duration' => 'integer',
            'exercises' => 'array',
            'total_volume' => 'float',
        ];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->client_id,
            'name' => $this->name,
            'templateId' => $this->template_id,
            'startedAt' => $this->started_at_ms,
            'finishedAt' => $this->finished_at_ms,
            'duration' => $this->duration,
            'exercises' => $this->exercises,
            'totalVolume' => (float) $this->total_volume,
        ];
    }
}
