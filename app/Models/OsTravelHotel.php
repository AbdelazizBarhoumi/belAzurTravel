<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OsTravelHotel extends Model
{
    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const PUBLISHED = 'published';

    public const REJECTED = 'rejected';

    public const ORPHANED = 'orphaned';

    public const PRICE_HAS_PRICE = 'has_price';

    public const PRICE_NO_AVAILABILITY = 'no_availability';

    public const PRICE_PROVIDER_ERROR = 'provider_error';

    public const PRICE_NEVER_REFRESHED = 'never_refreshed';

    public const AVAILABILITY_AVAILABLE = 'available';

    public const AVAILABILITY_STOP_SALE = 'stop_sale';

    public const AVAILABILITY_STOP_RESERVATION = 'stop_reservation';

    public const AVAILABILITY_NO_BOOKABLE_ROOM = 'no_bookable_room';

    public const AVAILABILITY_NOT_RETURNED = 'not_returned';

    protected $fillable = [
        'external_id', 'sync_id', 'payload', 'payload_hash',
        'name', 'city_external_id', 'city_name', 'category_title', 'stars', 'image',
        'status', 'prior_status', 'hotel_id', 'base_price', 'markup_percentage', 'currency',
        'approved_by', 'approved_at', 'rejected_at', 'last_synced_at',
        'detail_fetched_at',
        'country_external_id', 'country_name', 'price_status', 'last_price_attempt_at',
        'first_available_at', 'min_nights', 'availability_status',
        'stop_sale_ranges',
    ];

    protected $casts = [
        'payload' => 'array',
        'stars' => 'integer',
        'base_price' => 'integer',
        'markup_percentage' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'detail_fetched_at' => 'datetime',
        'last_price_attempt_at' => 'datetime',
        'first_available_at' => 'date',
        'min_nights' => 'integer',
        'stop_sale_ranges' => 'array',
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
