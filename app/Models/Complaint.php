<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Complaint extends Model
{
    protected $fillable = ['user_id', 'type', 'subject', 'description', 'booking_id', 'refund_amount', 'status', 'priority', 'admin_reply', 'resolved_at'];

    protected $casts = [
        'subject' => 'array',
        'description' => 'array',
        'admin_reply' => 'array',
        'refund_amount' => 'integer',
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ComplaintReply::class)->latest();
    }
}
