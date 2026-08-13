<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OsTravelSync extends Model
{
    public const RUNNING = 'running';

    public const SUCCESS = 'success';

    public const FAILED = 'failed';

    protected $fillable = [
        'batch', 'status', 'started_at', 'finished_at',
        'countries_count', 'cities_count', 'hotels_count', 'details_count',
        'orphaned_count', 'reactivated_count', 'error',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'countries_count' => 'integer',
        'cities_count' => 'integer',
        'hotels_count' => 'integer',
        'details_count' => 'integer',
        'orphaned_count' => 'integer',
        'reactivated_count' => 'integer',
    ];

    public function references(): HasMany
    {
        return $this->hasMany(OsTravelReference::class, 'sync_id');
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(OsTravelHotel::class, 'sync_id');
    }
}
