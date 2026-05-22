<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['entity_type', 'key', 'name'];

    protected $casts = [
        'name' => 'array',
    ];
}
