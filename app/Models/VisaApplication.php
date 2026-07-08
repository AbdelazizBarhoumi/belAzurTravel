<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisaApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'visa_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'passport_number',
        'birth_date',
        'travel_date',
        'visa_type',
        'previous_visa',
        'passport_copy_path',
        'notes',
        'status',
    ];

    protected $casts = [
        'previous_visa' => 'boolean',
        'birth_date' => 'date',
        'travel_date' => 'date',
    ];

    public function visa(): BelongsTo
    {
        return $this->belongsTo(Visa::class);
    }
}
