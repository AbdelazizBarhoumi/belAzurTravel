<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\EntityCategoryAssignment;

class Flight extends Model
{
    protected $fillable = [
        'code', 'trip_type', 'direct_only', 'baggage_included',
        'airline', 'from', 'to', 'duration', 'price', 'stops',
        'departure', 'arrival', 'image', 'details', 'date_from', 'date_to',
    ];

    protected $casts = [
        'airline' => 'array',
        'duration' => 'array',
        'stops' => 'array',
        'details' => 'array',
        'price' => 'integer',
        'date_from' => 'date',
        'date_to' => 'date',
        'direct_only' => 'boolean',
        'baggage_included' => 'boolean',
    ];

    public function segments(): HasMany
    {
        return $this->hasMany(FlightSegment::class, 'flight_id')->orderBy('segment_order');
    }

    public function categoryAssignments()
    {
        return $this->hasMany(EntityCategoryAssignment::class, 'entity_id')->where('entity_type', 'flights');
    }
}
