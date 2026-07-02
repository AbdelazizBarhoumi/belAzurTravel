<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visa extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'flag', 'region', 'processing', 'price', 'is_active', 'sort_order'];

    protected $casts = [
        'name' => 'array',
        'region' => 'array',
        'processing' => 'array',
        'price' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
