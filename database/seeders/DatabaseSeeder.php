<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\EntitySeeder;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach ([
            ['Sarah Johnson', 'sarah@example.com', 'client', true],
            ['Mike Chen', 'mike@example.com', 'client', true],
            ['Emma Davis', 'emma@example.com', 'client', true],
            ['James Wilson', 'james@example.com', 'client', false],
            ['Lisa Brown', 'lisa@example.com', 'client', true],
            ['Anna Admin', 'admin@example.com', 'admin', true],
            ['Liam Helper', 'liam@voyageur.com', 'assistant', true],
            ['Test User', 'test@example.com', 'client', true],
        ] as [$name, $email, $role, $active]) {
            User::query()->updateOrCreate(['email' => $email], [
                'name' => $name,
                // Password cast on the User model will hash plaintext automatically.
                // Passing a pre-hashed value here would double-hash it and break logins.
                'password' => 'password',
                'role' => $role,
                'active' => $active,
                'email_verified_at' => now(),
            ]);
        }

        $this->call([
            EntitySeeder::class,
            BookingSeeder::class,
        ]);
    }
}
