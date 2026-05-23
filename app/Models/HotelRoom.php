<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRoom extends Model
{
    protected $fillable = [
        'hotel_id',
        'name_en',
        'name_fr',
        'name_ar',
        'description_en',
        'description_fr',
        'description_ar',
        'price_per_night',
        'capacity',
        'size',
    ];

    protected $casts = [
        'price_per_night' => 'decimal:2',
        'size' => 'decimal:2',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function featureItems(): HasMany
    {
        return $this->hasMany(HotelRoomFeature::class)->orderBy('sort_order');
    }

    public function imageItems(): HasMany
    {
        return $this->hasMany(HotelRoomImage::class)->orderBy('sort_order');
    }
}
