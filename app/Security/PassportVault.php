<?php

namespace App\Security;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Encrypts passport data at rest with the dedicated PASSPORT_KEY (never
 * APP_KEY). Values are stored as "pv1:<payload>" so encrypted and legacy
 * plain-text values can be told apart; files are stored as encrypted blobs.
 */
class PassportVault
{
    public const PREFIX = 'pv1:';

    private ?Encrypter $encrypter = null;

    public function isConfigured(): bool
    {
        try {
            $this->encrypter();

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    public static function isEncrypted(?string $value): bool
    {
        return is_string($value) && str_starts_with($value, self::PREFIX);
    }

    public function encrypt(?string $value): ?string
    {
        if ($value === null || $value === '' || self::isEncrypted($value)) {
            return $value;
        }

        return self::PREFIX.$this->encrypter()->encryptString($value);
    }

    /**
     * Legacy plain-text values (written before encryption existed) are
     * returned unchanged until `passports:encrypt-existing` has run.
     */
    public function decrypt(?string $value): ?string
    {
        if (! self::isEncrypted($value)) {
            return $value;
        }

        try {
            return $this->encrypter()->decryptString(substr($value, strlen(self::PREFIX)));
        } catch (DecryptException $e) {
            throw new RuntimeException('Passport data could not be decrypted: wrong PASSPORT_KEY?', 0, $e);
        }
    }

    /**
     * Encrypt an upload and store it on the private disk. The plain bytes are
     * never written to disk. Returns the stored path.
     */
    public function storeFile(UploadedFile $file): string
    {
        return $this->storeBytes((string) file_get_contents($file->getRealPath()));
    }

    public function storeBytes(string $bytes): string
    {
        $path = trim(config('passport.directory'), '/').'/'.Str::ulid().'.bin';

        Storage::disk(config('passport.disk'))->put($path, self::PREFIX.$this->encrypter()->encryptString($bytes));

        return $path;
    }

    /** Plain bytes of a stored scan, or null when the file is missing. */
    public function readFile(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Older uploads may still sit on the public disk until the backfill runs.
        $disk = collect([config('passport.disk'), 'public'])
            ->map(fn (string $name) => Storage::disk($name))
            ->first(fn ($candidate) => $candidate->exists($path));
        if (! $disk) {
            return null;
        }

        $stored = (string) $disk->get($path);

        // Legacy plain upload (stored before encryption existed).
        if (! self::isEncrypted($stored)) {
            return $stored;
        }

        return $this->decrypt($stored);
    }

    public static function generateKey(): string
    {
        return 'base64:'.base64_encode(Encrypter::generateKey(config('passport.cipher', 'aes-256-gcm')));
    }

    private function encrypter(): Encrypter
    {
        if ($this->encrypter) {
            return $this->encrypter;
        }

        $key = (string) config('passport.key');
        if (str_starts_with($key, 'base64:')) {
            $key = (string) base64_decode(substr($key, 7), true);
        }

        $cipher = config('passport.cipher', 'aes-256-gcm');
        if ($key === '' || ! Encrypter::supported($key, $cipher)) {
            throw new RuntimeException('PASSPORT_KEY is missing or invalid. Run `php artisan passport:key`.');
        }

        return $this->encrypter = new Encrypter($key, $cipher);
    }
}
