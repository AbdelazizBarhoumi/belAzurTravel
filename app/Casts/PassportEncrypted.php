<?php

namespace App\Casts;

use App\Security\PassportVault;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * A string attribute stored encrypted with PASSPORT_KEY and decrypted on read.
 *
 * @implements CastsAttributes<string|null, string|null>
 */
class PassportEncrypted implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return app(PassportVault::class)->decrypt($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return app(PassportVault::class)->encrypt($value === null ? null : (string) $value);
    }
}
