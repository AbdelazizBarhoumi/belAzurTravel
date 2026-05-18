<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    protected $fillable = ['slug', 'name', 'country', 'category_key', 'category', 'price', 'rating', 'image', 'description', 'details'];
    protected $casts = ['name' => 'array', 'country' => 'array', 'category' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer', 'rating' => 'float'];
}
