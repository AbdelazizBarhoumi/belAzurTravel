<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlightSegment extends Model
{
    protected $fillable = [
        'flight_id',
        'segment_order',
        'from_airport',
        'to_airport',
        'departure_time',
        'arrival_time',
        'date',
        'duration',
    ];

    protected $casts = [
        'segment_order' => 'integer',
        'date' => 'date',
    ];

    public function flight(): BelongsTo
    {
        return $this->belongsTo(Flight::class);
    }
}
