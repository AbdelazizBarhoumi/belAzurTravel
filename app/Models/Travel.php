<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Travel extends Model
{
    use HasFactory;

    protected $table = 'travels';

    protected $fillable = [
        'slug',
        'name',
        'location',
        'category_key',
        'category',
        'duration',
        'duration_days',
        'duration_nights',
        'max_group',
        'price',
        'rating',
        'image',
        'description',
        'details',
        'itinerary',
        'includes',
        'excludes',
        'images',
        // Filter fields
        'istanbul', 'asie', 'europe', 'afrique_nord',
        'jeune', 'tranquille',
    ];

    protected $casts = [
        'name' => 'array',
        'location' => 'array',
        'category' => 'array',
        'duration' => 'array',
        'description' => 'array',
        'details' => 'array',
        'itinerary' => 'json',
        'includes' => 'json',
        'excludes' => 'json',
        'images' => 'json',
        'duration_days' => 'integer',
        'duration_nights' => 'integer',
        'max_group' => 'integer',
        'price' => 'integer',
        'rating' => 'float',
        // Filter fields as boolean
        'istanbul' => 'boolean',
        'asie' => 'boolean',
        'europe' => 'boolean',
        'afrique_nord' => 'boolean',
        'jeune' => 'boolean',
        'tranquille' => 'boolean',
    ];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'travels');
    }
}
