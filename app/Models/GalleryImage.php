<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GalleryImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'url',
        'caption',
        'sort_order',
    ];

    protected $casts = [
        'caption' => 'array',
    ];
}
