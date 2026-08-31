<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TravelRequest extends Model
{
    protected $fillable = [
        'committee_name',
        'member_count',
        'civility',
        'last_name',
        'first_name',
        'phone',
        'email',
        'message',
        'status',
    ];
}
