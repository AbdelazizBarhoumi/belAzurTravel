<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $fillable = ['slug', 'title', 'excerpt', 'date', 'category', 'image', 'content'];
    protected $casts = ['title' => 'array', 'excerpt' => 'array', 'category' => 'array', 'content' => 'array'];
}
