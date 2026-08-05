<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    protected $fillable = [
        'slug', 'code', 'destination_slug', 'name', 'location',
        'category_key', 'category', 'price', 'price_per_night',
        'rating', 'stars', 'reviews', 'description', 'image',
        'tags', 'details',
        // Filter fields
        'htel_recommande', 'tarifs_promo', 'enfant_gratuit',
        'disponible_seulement', 'annulation_gratuite',
        'logement_simple', 'petit_dejeuner', 'demi_pension', 'pension_complete',
        'categorie_4_etoiles',
        'chambre_double', 'suite', 'chambre_standard', 'suite_junior',
        'thalasso_spa', 'nature_aventure', 'famille', 'affaires',
        'sport_loisir', 'detente',
    ];

    protected $casts = [
        'name' => 'array',
        'location' => 'array',
        'category' => 'array',
        'tags' => 'array',
        'details' => 'array',
        'description' => 'array',
        'price' => 'integer',
        'price_per_night' => 'integer',
        'rating' => 'float',
        'stars' => 'integer',
        'reviews' => 'integer',
        // Filter fields as boolean
        'htel_recommande' => 'boolean',
        'tarifs_promo' => 'boolean',
        'enfant_gratuit' => 'boolean',
        'disponible_seulement' => 'boolean',
        'annulation_gratuite' => 'boolean',
        'logement_simple' => 'boolean',
        'petit_dejeuner' => 'boolean',
        'demi_pension' => 'boolean',
        'pension_complete' => 'boolean',
        'categorie_4_etoiles' => 'boolean',
        'chambre_double' => 'boolean',
        'suite' => 'boolean',
        'chambre_standard' => 'boolean',
        'suite_junior' => 'boolean',
        'thalasso_spa' => 'boolean',
        'nature_aventure' => 'boolean',
        'famille' => 'boolean',
        'affaires' => 'boolean',
        'sport_loisir' => 'boolean',
        'detente' => 'boolean',
    ];

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'amenity_hotel');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(HotelRoom::class);
    }

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')
            ->where('entity_type', 'hotels');
    }
}
