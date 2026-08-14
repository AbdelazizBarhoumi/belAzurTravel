<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A bulk price-refresh request created by an admin. Processing is deferred to
 * a scheduled command (`os-travel:process-refresh-request`) so a large refresh
 * never blocks a web request.
 */
class OsTravelRefreshRequest extends Model
{
    public const PENDING = 'pending';

    public const PROCESSING = 'processing';

    public const COMPLETED = 'completed';

    public const FAILED = 'failed';

    protected $fillable = [
        'status', 'requested_by', 'ids', 'check_in', 'check_out',
        'started_at', 'finished_at', 'updated', 'omitted', 'error',
        'omitted_ids', 'failed_ids',
    ];

    protected $casts = [
        'ids' => 'array',
        'check_in' => 'date',
        'check_out' => 'date',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'updated' => 'integer',
        'omitted' => 'integer',
        'omitted_ids' => 'array',
        'failed_ids' => 'array',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
