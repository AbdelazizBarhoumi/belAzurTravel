<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'name', 'category_key', 'category', 'price', 'seats', 'fuel', 'transmission', 'image', 'details'];

    protected $casts = ['name' => 'array', 'category' => 'array', 'fuel' => 'array', 'transmission' => 'array', 'details' => 'array', 'price' => 'integer', 'seats' => 'integer'];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'cars');
    }
}
