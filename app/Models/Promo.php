<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    protected $fillable = ['code', 'title', 'discount', 'description', 'expires', 'color', 'details'];
    protected $casts = ['title' => 'array', 'discount' => 'array', 'description' => 'array', 'expires' => 'array', 'details' => 'array'];
}
