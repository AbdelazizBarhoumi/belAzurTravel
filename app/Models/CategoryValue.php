<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryValue extends Model
{
    protected $table = 'category_type_values';

    protected $fillable = ['category_type_id', 'key', 'name', 'color'];

    protected $casts = [
        'name' => 'array',
    ];

    public function type()
    {
        return $this->belongsTo(CategoryType::class, 'category_type_id');
    }
}
