<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deal extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'discount', 'expires', 'category', 'category_key', 'details', 'highlights', 'terms'];

    protected $casts = ['title' => 'array', 'description' => 'array', 'discount' => 'array', 'expires' => 'array', 'category' => 'array', 'details' => 'array', 'highlights' => 'array', 'terms' => 'array'];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'deals');
    }
}
