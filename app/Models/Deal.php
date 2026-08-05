<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deal extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'discount', 'category', 'category_key', 'details', 'highlights', 'terms', 'date_from', 'date_to'];

    protected $casts = ['title' => 'array', 'description' => 'array', 'discount' => 'array', 'category' => 'array', 'details' => 'array', 'highlights' => 'array', 'terms' => 'array', 'date_from' => 'date', 'date_to' => 'date'];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'deals');
    }
}
