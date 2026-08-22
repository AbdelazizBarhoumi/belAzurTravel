<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $table = 'site_settings';

    public $timestamps = false;

    protected $fillable = [
        'company_name',
        'email',
        'phone',
        'phone2',
        'whatsapp',
        'address',
        'plus_code',
        'map_lat',
        'map_lng',
        'map_embed',
        'year',
        'social_links',
        'legal_sections',
        'footer_links',
        'hours',
        'content',
        'booking_expiry_hours',
        'trip_reminder_days',
        'digest_time',
    ];

    protected $casts = [
        'social_links' => 'array',
        'legal_sections' => 'array',
        'footer_links' => 'array',
        'hours' => 'array',
        'content' => 'array',
        'booking_expiry_hours' => 'integer',
        'trip_reminder_days' => 'integer',
    ];
}
