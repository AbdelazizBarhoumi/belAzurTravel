<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tour extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'location',
        'category_key',
        'category',
        'duration',
        'duration_days',
        'duration_nights',
        'max_group',
        'price',
        'rating',
        'image',
        'description',
        'details',
        'itinerary',
        'includes',
        'excludes',
        'images',
    ];

    protected $casts = [
        'name' => 'array',
        'location' => 'array',
        'category' => 'array',
        'duration' => 'array',
        'description' => 'array',
        'details' => 'array',
        'itinerary' => 'array',
        'includes' => 'array',
        'excludes' => 'array',
        'images' => 'array',
        'duration_days' => 'integer',
        'duration_nights' => 'integer',
        'max_group' => 'integer',
        'price' => 'integer',
        'rating' => 'float',
    ];
}
