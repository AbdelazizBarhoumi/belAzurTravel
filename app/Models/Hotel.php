<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\HotelRoom;

class Hotel extends Model
{
    protected $fillable = [
        'slug', 'code', 'destination_slug', 'name', 'location', 
        'category_key', 'category', 'price', 'price_per_night', 
        'rating', 'stars', 'reviews', 'description', 'image', 'amenities',
        'tags', 'details'
    ];

    protected $casts = [
        'name' => 'array', 
        'location' => 'array', 
        'category' => 'array', 
        'tags' => 'array', 
        'details' => 'array', 
        'description' => 'array', 
        'price' => 'integer', 
        'price_per_night' => 'integer', 
        'rating' => 'float', 
        'stars' => 'integer', 
        'reviews' => 'integer'
    ];


    public function amenities(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'amenity_hotel');
    }

    public function rooms(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HotelRoom::class);
    }
}
