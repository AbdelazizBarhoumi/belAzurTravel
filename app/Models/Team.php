<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'role', 'bio', 'image_path', 'linkedin', 'twitter', 'email'];

    protected $casts = [
        'name' => 'array',
        'role' => 'array',
        'bio' => 'array',
    ];
}
