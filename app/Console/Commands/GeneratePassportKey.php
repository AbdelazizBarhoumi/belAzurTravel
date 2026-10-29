<?php

namespace App\Console\Commands;

use App\Security\PassportVault;
use Illuminate\Console\Command;

class GeneratePassportKey extends Command
{
    protected $signature = 'passport:key
        {--show : Only display the key instead of writing it to .env}
        {--force : Replace an existing PASSPORT_KEY (makes existing passports unreadable!)}';

    protected $description = 'Generate the PASSPORT_KEY used to encrypt passport data at rest';

    public function handle(): int
    {
        $key = PassportVault::generateKey();

        if ($this->option('show')) {
            $this->line($key);

            return self::SUCCESS;
        }

        $envPath = $this->laravel->environmentFilePath();
        $env = is_file($envPath) ? (string) file_get_contents($envPath) : '';

        if (preg_match('/^PASSPORT_KEY=(.+)$/m', $env, $match) && trim($match[1]) !== '' && ! $this->option('force')) {
            $this->error('PASSPORT_KEY is already set. Replacing it makes every stored passport unreadable.');
            $this->line('Use --force only if no passport data has been stored with the current key.');

            return self::FAILURE;
        }

        $line = "PASSPORT_KEY={$key}";
        $env = preg_match('/^PASSPORT_KEY=.*$/m', $env)
            ? (string) preg_replace('/^PASSPORT_KEY=.*$/m', $line, $env)
            : rtrim($env).PHP_EOL.$line.PHP_EOL;

        file_put_contents($envPath, $env);
        config(['passport.key' => $key]);

        $this->info('PASSPORT_KEY written to .env.');
        $this->warn('Back it up outside this server (e.g. a password manager): without it, stored passports cannot be decrypted.');

        return self::SUCCESS;
    }
}
