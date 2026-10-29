<?php

namespace App\Console\Commands;

use App\Casts\GuestsWithEncryptedPassports;
use App\Security\PassportVault;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * One-off (idempotent) backfill: encrypts passport data written before
 * encryption existed. Safe to run repeatedly; already-encrypted values and
 * files are skipped. Works on raw rows so model casts never double-encrypt.
 */
class EncryptExistingPassports extends Command
{
    protected $signature = 'passports:encrypt-existing {--dry-run : Only report what would be encrypted}';

    protected $description = 'Encrypt legacy plain-text passport numbers, traveller passports and passport scans';

    public function handle(PassportVault $vault): int
    {
        if (! $vault->isConfigured()) {
            $this->error('PASSPORT_KEY is missing or invalid. Run `php artisan passport:key` first.');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');
        $numbers = $files = $guests = 0;

        DB::table('visa_applications')->orderBy('id')->chunkById(200, function ($rows) use ($vault, $dry, &$numbers, &$files) {
            foreach ($rows as $row) {
                $update = [];

                if ($row->passport_number !== null && $row->passport_number !== '' && ! PassportVault::isEncrypted($row->passport_number)) {
                    $update['passport_number'] = $vault->encrypt($row->passport_number);
                    $numbers++;
                }

                $moved = $this->encryptScan($vault, $row, $dry);
                if ($moved) {
                    $update += $moved;
                    $files++;
                }

                if ($update && ! $dry) {
                    DB::table('visa_applications')->where('id', $row->id)->update($update);
                }
            }
        });

        DB::table('bookings')->whereNotNull('guests')->orderBy('id')->chunkById(200, function ($rows) use ($vault, $dry, &$guests) {
            foreach ($rows as $row) {
                $decoded = json_decode((string) $row->guests, true);
                if (! is_array($decoded)) {
                    continue;
                }

                $encrypted = GuestsWithEncryptedPassports::map($decoded, fn (?string $v) => $vault->encrypt($v));
                if ($encrypted === $decoded) {
                    continue;
                }

                $guests++;
                if (! $dry) {
                    DB::table('bookings')->where('id', $row->id)->update([
                        'guests' => json_encode($encrypted, JSON_UNESCAPED_UNICODE),
                    ]);
                }
            }
        });

        $this->info(($dry ? '[dry run] ' : '')."Passport numbers: {$numbers}, scans: {$files}, bookings with traveller passports: {$guests}.");

        return self::SUCCESS;
    }

    /**
     * Re-store a plain scan (private or legacy public disk) as an encrypted
     * blob, then delete the plain file once the encrypted copy reads back.
     *
     * @return array<string, string|null>|null columns to update, or null when nothing to do
     */
    private function encryptScan(PassportVault $vault, object $row, bool $dry): ?array
    {
        $path = $row->passport_copy_path;
        if (! $path) {
            return null;
        }

        foreach ([config('passport.disk'), 'public'] as $diskName) {
            $disk = Storage::disk($diskName);
            if (! $disk->exists($path)) {
                continue;
            }

            $bytes = (string) $disk->get($path);
            if (PassportVault::isEncrypted($bytes)) {
                return null;
            }

            if ($dry) {
                return ['passport_copy_path' => $path];
            }

            $newPath = $vault->storeBytes($bytes);
            if ($vault->readFile($newPath) !== $bytes) {
                Storage::disk(config('passport.disk'))->delete($newPath);
                $this->warn("Skipped scan of application {$row->id}: encrypted copy did not verify.");

                return null;
            }

            $disk->delete($path);

            return [
                'passport_copy_path' => $newPath,
                'passport_copy_mime' => $row->passport_copy_mime ?? $this->guessMime($path, $bytes),
                'passport_copy_name' => $row->passport_copy_name ?? basename($path),
            ];
        }

        return null;
    }

    private function guessMime(string $path, string $bytes): string
    {
        $mime = class_exists(\finfo::class) ? (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes) : null;
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }

        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            default => 'image/jpeg',
        };
    }
}
