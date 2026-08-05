<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach ([
            ['The Owner', 'direction@belazurtravel.com', 'owner', true],
            ['Super Admin', 'management@belazurtravel.com', 'superadmin', true],
            ['Anna Admin', 'contact@belazurtravel.com', 'admin', true],
            ['Sarah Johnson', 'booking@belazurtravel.com', 'client', true],
            ['Mike Chen', 'commercial@belazurtravel.com', 'client', true],
            ['Emma Davis', 'noreply@belazurtravel.com', 'client', true],
        ] as [$name, $email, $role, $active]) {
            User::query()->updateOrCreate(['email' => $email], [
                'name' => $name,
                'password' => 'password',
                'role' => $role,
                'active' => $active,
                'email_verified_at' => $role === 'owner' ? null : now(), // Owner will test auto-verification bypass
            ]);
        }

        // Add 20 more clients for pagination testing
        for ($i = 1; $i <= 20; $i++) {
            User::query()->updateOrCreate(['email' => "client{$i}@belazurtravel.com"], [
                'name' => "Client User {$i}",
                'password' => 'password',
                'role' => 'client',
                'active' => true,
                'email_verified_at' => now(),
            ]);
        }

        // Seed categories first so hotels/tours/travels can reference real category rows.
        $this->call([
            CategorySeeder::class,
            SeedJsDataSeeder::class,
            TravelSeeder::class,
            HotelCategoryTypesSeeder::class,
            TourCategoryTypesSeeder::class,
            TravelCategoryTypesSeeder::class,
            VisaSeeder::class,
            VisaApplicationSeeder::class,
        ]);
    }
}
