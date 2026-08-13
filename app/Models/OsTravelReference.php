<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OsTravelReference extends Model
{
    public const TYPE_COUNTRY = 'country';

    public const TYPE_CITY = 'city';

    public const TYPE_BOARDING = 'boarding';

    public const TYPE_CATEGORY = 'category';

    public const TYPE_CURRENCY = 'currency';

    protected $table = 'os_travel_reference';

    protected $fillable = [
        'type', 'external_id', 'code', 'name', 'payload', 'sync_id',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function sync(): BelongsTo
    {
        return $this->belongsTo(OsTravelSync::class, 'sync_id');
    }
}
