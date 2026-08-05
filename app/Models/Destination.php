<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'name', 'country', 'category_key', 'price', 'rating', 'image', 'description', 'details', 'date_from', 'date_to'];

    protected $casts = ['name' => 'array', 'country' => 'array', 'description' => 'array', 'details' => 'array', 'price' => 'integer', 'rating' => 'float', 'date_from' => 'date', 'date_to' => 'date'];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'destinations');
    }
}
