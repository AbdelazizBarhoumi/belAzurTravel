<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tour extends Model
{
    use HasFactory;

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
        'date_from',
        'date_to',
        // Filter fields
        'djerba', 'nord_tunisien', 'sud_tunisien', 'tunisia',
        'tranquille', 'famille', 'djerba_by_vol', 'jeune',
        'nord', 'tranquille_groupe',
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
        'date_from' => 'date',
        'date_to' => 'date',
        'duration_days' => 'integer',
        'duration_nights' => 'integer',
        'max_group' => 'integer',
        'price' => 'integer',
        'rating' => 'float',
        // Filter fields as boolean
        'djerba' => 'boolean',
        'nord_tunisien' => 'boolean',
        'sud_tunisien' => 'boolean',
        'tunisia' => 'boolean',
        'tranquille' => 'boolean',
        'famille' => 'boolean',
        'djerba_by_vol' => 'boolean',
        'jeune' => 'boolean',
        'nord' => 'boolean',
        'tranquille_groupe' => 'boolean',
    ];

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'tours');
    }
}
