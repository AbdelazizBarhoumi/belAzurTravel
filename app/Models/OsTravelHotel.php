<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OsTravelHotel extends Model
{
    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const REJECTED = 'rejected';

    public const ORPHANED = 'orphaned';

    protected $fillable = [
        'external_id', 'sync_id', 'payload', 'payload_hash',
        'name', 'city_external_id', 'city_name', 'category_title', 'stars', 'image',
        'status', 'prior_status', 'hotel_id', 'markup_percentage', 'currency',
        'approved_by', 'approved_at', 'rejected_at', 'last_synced_at',
        'detail_fetched_at',
        'country_external_id', 'country_name',
    ];

    protected $casts = [
        'payload' => 'array',
        'stars' => 'integer',
        'markup_percentage' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'detail_fetched_at' => 'datetime',
    ];

    public function sync(): BelongsTo
    {
        return $this->belongsTo(OsTravelSync::class, 'sync_id');
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
