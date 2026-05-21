<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deal extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'discount', 'expires', 'category', 'category_key', 'details'];
    protected $casts = ['title' => 'array', 'description' => 'array', 'discount' => 'array', 'expires' => 'array', 'category' => 'array', 'details' => 'array'];
}
