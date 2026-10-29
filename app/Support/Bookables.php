<?php

namespace App\Support;

use App\Models\Car;
use App\Models\Destination;
use App\Models\Event;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Tour;
use App\Models\Travel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Resolves a catalogue item from the (type, slug-or-code) pair the public
 * pages use — shared by bookings and favorites so both accept the same keys.
 */
class Bookables
{
    public const TYPES = ['destination', 'hotel', 'tour', 'flight', 'car', 'travel', 'event'];

    public static function find(string $type, ?string $identifier): ?Model
    {
        if ($identifier === null || $identifier === '') {
            return null;
        }

        $query = match ($type) {
            'destination' => Destination::query()->where('slug', $identifier),
            'hotel' => Hotel::query()->where(fn (Builder $query) => $query->where('slug', $identifier)->orWhere('code', $identifier)),
            'tour' => Tour::query()->where('slug', $identifier),
            'flight' => Flight::query()->where('code', $identifier),
            'car' => Car::query()->where(fn (Builder $query) => $query->where('slug', $identifier)->orWhere('id', $identifier)),
            'travel' => Travel::query()->where('slug', $identifier),
            'event' => Event::query()->where('slug', $identifier),
            default => null,
        };

        return $query?->first();
    }
}
