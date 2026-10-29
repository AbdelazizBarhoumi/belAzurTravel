<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    protected $fillable = ['user_id', 'type', 'item_key', 'snapshot'];

    protected $casts = [
        'snapshot' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, mixed> */
    public function toClientArray(): array
    {
        $snapshot = $this->snapshot ?? [];

        return [
            'id' => $this->item_key,
            'type' => $this->type,
            'name' => (string) ($snapshot['name'] ?? $this->item_key),
            'image' => (string) ($snapshot['image'] ?? ''),
            'price' => isset($snapshot['price']) ? (float) $snapshot['price'] : null,
            'location' => $snapshot['location'] ?? null,
        ];
    }
}
