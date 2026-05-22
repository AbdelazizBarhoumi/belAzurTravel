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
        'whatsapp',
        'address',
        'plus_code',
        'year',
        'social_links',
        'legal_sections',
        'footer_links',
        'hours',
        'content',
    ];

    protected $casts = [
        'social_links' => 'array',
        'legal_sections' => 'array',
        'footer_links' => 'array',
        'hours' => 'array',
        'content' => 'array',
    ];
}
