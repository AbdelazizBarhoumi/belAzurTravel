<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'title', 'location', 'category_key', 'category', 'price', 'image', 'description', 'details', 'date_from', 'date_to'];

    protected $casts = ['title' => 'array', 'location' => 'array', 'category' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer', 'date_from' => 'date', 'date_to' => 'date'];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'events');
    }
}
