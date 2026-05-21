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
        'title',
        'category',
    ];

    protected $casts = [
        'caption' => 'array',
        'title' => 'array',
    ];
}
