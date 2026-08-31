<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryType extends Model
{
    protected $fillable = ['entity_type', 'key', 'label', 'sort_order', 'filter_style', 'locked', 'multi'];

    protected $casts = [
        'label' => 'array',
        'locked' => 'boolean',
        'multi' => 'boolean',
    ];

    public function values()
    {
        return $this->hasMany(CategoryValue::class);
    }

    public function assignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class);
    }
}
