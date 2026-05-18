<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    protected $fillable = ['slug', 'code', 'destination_slug', 'name', 'location', 'price', 'rating', 'stars', 'reviews', 'image', 'amenities', 'tags', 'details'];
    protected $casts = ['name' => 'array', 'location' => 'array', 'amenities' => 'array', 'tags' => 'array', 'details' => 'array', 'price' => 'integer', 'rating' => 'float', 'stars' => 'integer', 'reviews' => 'integer'];
}
