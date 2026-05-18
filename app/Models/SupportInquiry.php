<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportInquiry extends Model
{
    protected $fillable = ['user_id', 'assigned_to', 'client', 'subject', 'message', 'status', 'priority', 'replies', 'resolved_at'];

    protected $casts = [
        'client' => 'array',
        'subject' => 'array',
        'message' => 'array',
        'replies' => 'array',
        'resolved_at' => 'datetime',
    ];
}
