<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    public const SOURCE_OSTRAVEL = 'ostravel';

    public const SOURCE_MANUAL = 'manual';

    public const BOOKING_INSTANT = 'instant';

    public const BOOKING_REQUEST = 'request';

    protected $attributes = [
        'source' => self::SOURCE_MANUAL,
        'booking_mode' => self::BOOKING_INSTANT,
    ];

    protected $fillable = [
        'slug', 'code', 'destination_slug', 'name', 'location',
        'category_key', 'category', 'price', 'base_price',
        'markup_percentage', 'currency', 'source', 'booking_mode',
        'price_per_night',
        'rating', 'stars', 'reviews', 'description', 'image',
        'tags', 'details', 'meta',
        'date_from', 'date_to',
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
        'meta' => 'array',
        'description' => 'array',
        'price' => 'integer',
        'base_price' => 'integer',
        'markup_percentage' => 'decimal:2',
        'price_per_night' => 'integer',
        'rating' => 'float',
        'stars' => 'integer',
        'reviews' => 'integer',
        'date_from' => 'date',
        'date_to' => 'date',
        'source' => 'string',
        'booking_mode' => 'string',
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

    public function dailyPrices(): HasMany
    {
        return $this->hasMany(HotelDailyPrice::class);
    }

    /**
     * Whether this hotel is wired to an approved OS-TRAVEL staging row with a
     * public `hotels` row linked. This is the authoritative signal that a hotel
     * is provider-backed — regardless of the `source` column value.
     */
    public function isProviderLinked(): bool
    {
        return OsTravelHotel::query()
            ->whereNotNull('hotel_id')
            ->where('hotel_id', $this->id)
            ->exists();
    }
}
