<?php

namespace App\Casts;

use App\Security\PassportVault;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Booking travellers (JSON array): behaves like the `array` cast, but each
 * traveller's passport fields are stored encrypted with PASSPORT_KEY.
 *
 * @implements CastsAttributes<array<int, array<string, mixed>>|null, array<int, array<string, mixed>>|null>
 */
class GuestsWithEncryptedPassports implements CastsAttributes
{
    public const FIELDS = ['passport_number', 'passport_expiry'];

    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        $guests = is_string($value) ? json_decode($value, true) : $value;

        return is_array($guests) ? self::map($guests, fn (?string $v) => app(PassportVault::class)->decrypt($v)) : null;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $guests = is_string($value) ? (json_decode($value, true) ?? []) : (array) $value;

        return json_encode(self::map($guests, fn (?string $v) => app(PassportVault::class)->encrypt($v)), JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param  array<int|string, mixed>  $guests
     * @param  callable(?string): ?string  $transform
     * @return array<int|string, mixed>
     */
    public static function map(array $guests, callable $transform): array
    {
        foreach ($guests as $index => $guest) {
            if (! is_array($guest)) {
                continue;
            }
            foreach (self::FIELDS as $field) {
                if (isset($guest[$field]) && is_scalar($guest[$field])) {
                    $guests[$index][$field] = $transform((string) $guest[$field]);
                }
            }
        }

        return $guests;
    }
}
