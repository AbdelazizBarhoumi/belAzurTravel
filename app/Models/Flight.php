<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    protected $fillable = ['code', 'airline', 'from', 'to', 'duration', 'price', 'stops', 'departure', 'arrival', 'details'];
    protected $casts = ['airline' => 'array', 'to' => 'array', 'duration' => 'array', 'stops' => 'array', 'details' => 'array', 'price' => 'integer'];
}
