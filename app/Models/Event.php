<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = ['slug', 'title', 'location', 'date', 'category_key', 'category', 'price', 'image', 'description', 'details'];
    protected $casts = ['title' => 'array', 'location' => 'array', 'date' => 'array', 'category' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer'];
}
