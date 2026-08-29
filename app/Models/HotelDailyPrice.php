<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelDailyPrice extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'date',
        'price',
        'base_price',
        'currency',
        'fetched_at',
    ];

    protected $casts = [
        'date' => 'date',
        'price' => 'integer',
        'base_price' => 'integer',
        'fetched_at' => 'datetime',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }
}
