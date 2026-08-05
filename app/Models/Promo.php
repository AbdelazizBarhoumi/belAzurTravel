<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'title', 'discount', 'description', 'color', 'details', 'date_from', 'date_to'];

    protected $casts = ['title' => 'array', 'discount' => 'array', 'description' => 'array', 'details' => 'array', 'date_from' => 'date', 'date_to' => 'date'];
}
