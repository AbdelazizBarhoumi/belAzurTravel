<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = ['slug', 'title', 'location', 'date', 'price', 'image', 'description', 'details'];
    protected $casts = ['title' => 'array', 'location' => 'array', 'date' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer'];
}
