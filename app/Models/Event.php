<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'title', 'location', 'date', 'category_key', 'category', 'price', 'image', 'description', 'details'];

    protected $casts = ['title' => 'array', 'location' => 'array', 'date' => 'array', 'category' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer'];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'events');
    }
}
