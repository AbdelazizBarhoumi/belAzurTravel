<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'name', 'country', 'category_key', 'price', 'rating', 'image', 'description', 'details'];

    protected $casts = ['name' => 'array', 'country' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer', 'rating' => 'float'];
}
