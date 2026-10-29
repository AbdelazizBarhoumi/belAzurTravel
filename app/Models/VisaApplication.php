<?php

namespace App\Models;

use App\Casts\PassportEncrypted;
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
        'passport_copy_mime',
        'passport_copy_name',
        'notes',
        'status',
    ];

    protected $casts = [
        'passport_number' => PassportEncrypted::class,
        'previous_visa' => 'boolean',
        'birth_date' => 'date',
        'travel_date' => 'date',
    ];

    /** Download name for the decrypted passport scan, e.g. passport-amina-trabelsi.pdf. */
    public function passportCopyFilename(): string
    {
        $extension = pathinfo((string) ($this->passport_copy_name ?: $this->passport_copy_path), PATHINFO_EXTENSION);
        if ($extension === '' || $extension === 'bin') {
            $extension = match ($this->passport_copy_mime) {
                'application/pdf' => 'pdf',
                'image/png' => 'png',
                default => 'jpg',
            };
        }

        return 'passport-'.str($this->first_name.' '.$this->last_name)->slug().'.'.strtolower($extension);
    }

    public function visa(): BelongsTo
    {
        return $this->belongsTo(Visa::class);
    }
}
