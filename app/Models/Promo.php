<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'title', 'discount', 'description', 'expires', 'color', 'details'];

    protected $casts = ['title' => 'array', 'discount' => 'array', 'description' => 'array', 'expires' => 'array', 'details' => 'array'];
}
