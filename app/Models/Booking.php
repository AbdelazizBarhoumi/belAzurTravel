<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    protected $fillable = ['user_id', 'type', 'item_slug', 'item_id', 'items', 'start_date', 'end_date', 'client', 'travelers', 'promo_code', 'notes', 'total_amount', 'status', 'confirmed_at', 'cancelled_at'];

    protected $casts = ['items' => 'array', 'client' => 'array', 'travelers' => 'array', 'start_date' => 'date', 'end_date' => 'date', 'total_amount' => 'integer', 'confirmed_at' => 'datetime', 'cancelled_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
