<?php

namespace App\Console\Commands;

use Database\Seeders\TestDataSeeder;
use Illuminate\Console\Command;

class SeedTestData extends Command
{
    protected $signature = 'db:seed-test';

    protected $description = 'Seed database with comprehensive test data for UI preview';

    public function handle(): int
    {
        $this->newLine();
        $this->info('Seeding test data...');

        $seeder = new TestDataSeeder();
        $seeder->run();

        $this->newLine();
        $this->info('Test data seeded successfully!');
        $this->newLine();

        return self::SUCCESS;
    }
}
