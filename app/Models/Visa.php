<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visa extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'flag', 'processing', 'price', 'is_active', 'sort_order', 'date_from', 'date_to'];

    protected $casts = [
        'name' => 'array',
        'processing' => 'array',
        'price' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'date_from' => 'date',
        'date_to' => 'date',
    ];
}
