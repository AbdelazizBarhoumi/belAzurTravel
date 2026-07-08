<?php

namespace Database\Seeders;

use App\Models\Visa;
use App\Models\VisaApplication;
use Illuminate\Database\Seeder;

class VisaApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $applications = [
            [
                'country_code' => 'FR',
                'first_name' => 'Ahmed',
                'last_name' => 'Ben Ali',
                'email' => 'ahmed.benali@example.com',
                'phone' => '+216 98 123 456',
                'passport_number' => 'A12345678',
                'birth_date' => '1990-05-15',
                'travel_date' => '2026-08-20',
                'visa_type' => 'tourism',
                'previous_visa' => true,
                'notes' => 'Premier voyage en France',
                'status' => 'pending',
            ],
            [
                'country_code' => 'IT',
                'first_name' => 'Fatma',
                'last_name' => 'Mansour',
                'email' => 'fatma.mansour@example.com',
                'phone' => '+216 22 987 654',
                'passport_number' => 'B98765432',
                'birth_date' => '1985-11-22',
                'travel_date' => '2026-09-10',
                'visa_type' => 'business',
                'previous_visa' => false,
                'notes' => null,
                'status' => 'pending',
            ],
            [
                'country_code' => 'DE',
                'first_name' => 'Mohamed',
                'last_name' => 'Sassi',
                'email' => 'mohamed.sassi@example.com',
                'phone' => '+216 71 555 123',
                'passport_number' => 'C11223344',
                'birth_date' => '1992-03-08',
                'travel_date' => '2026-10-05',
                'visa_type' => 'study',
                'previous_visa' => true,
                'notes' => 'Études universitaires à Berlin',
                'status' => 'approved',
            ],
            [
                'country_code' => 'GB',
                'first_name' => 'Amira',
                'last_name' => 'Trabelsi',
                'email' => 'amira.trabelsi@example.com',
                'phone' => '+216 99 888 777',
                'passport_number' => 'D55667788',
                'birth_date' => '1988-07-30',
                'travel_date' => '2026-11-15',
                'visa_type' => 'family',
                'previous_visa' => false,
                'notes' => 'Visite familiale à Londres',
                'status' => 'pending',
            ],
            [
                'country_code' => 'US',
                'first_name' => 'Youssef',
                'last_name' => 'Khelifi',
                'email' => 'youssef.khelifi@example.com',
                'phone' => '+216 55 444 333',
                'passport_number' => 'E99887766',
                'birth_date' => '1995-01-12',
                'travel_date' => '2026-12-01',
                'visa_type' => 'tourism',
                'previous_visa' => true,
                'notes' => null,
                'status' => 'rejected',
            ],
            [
                'country_code' => 'ES',
                'first_name' => 'Nour',
                'last_name' => 'Bouazizi',
                'email' => 'nour.bouazizi@example.com',
                'phone' => '+216 20 111 222',
                'passport_number' => 'F44332211',
                'birth_date' => '1993-09-25',
                'travel_date' => '2026-08-15',
                'visa_type' => 'tourism',
                'previous_visa' => false,
                'notes' => 'Voyage à Barcelone et Madrid',
                'status' => 'pending',
            ],
            [
                'country_code' => 'AE',
                'first_name' => 'Rim',
                'last_name' => 'Hadj Ali',
                'email' => 'rim.hadjali@example.com',
                'phone' => '+216 73 666 555',
                'passport_number' => 'G77889900',
                'birth_date' => '1991-04-18',
                'travel_date' => '2026-09-25',
                'visa_type' => 'transit',
                'previous_visa' => true,
                'notes' => null,
                'status' => 'approved',
            ],
            [
                'country_code' => 'CA',
                'first_name' => 'Karim',
                'last_name' => 'Dridi',
                'email' => 'karim.dridi@example.com',
                'phone' => '+216 74 222 111',
                'passport_number' => 'H11229988',
                'birth_date' => '1987-12-05',
                'travel_date' => '2027-01-10',
                'visa_type' => 'study',
                'previous_visa' => false,
                'notes' => 'Maîtrise en informatique à Montréal',
                'status' => 'pending',
            ],
        ];

        foreach ($applications as $app) {
            $visa = Visa::where('code', $app['country_code'])->first();
            if (!$visa) continue;

            VisaApplication::updateOrCreate(
                [
                    'visa_id' => $visa->id,
                    'passport_number' => $app['passport_number'],
                ],
                [
                    'first_name' => $app['first_name'],
                    'last_name' => $app['last_name'],
                    'email' => $app['email'],
                    'phone' => $app['phone'],
                    'birth_date' => $app['birth_date'],
                    'travel_date' => $app['travel_date'],
                    'visa_type' => $app['visa_type'],
                    'previous_visa' => $app['previous_visa'],
                    'notes' => $app['notes'],
                    'status' => $app['status'],
                ],
            );
        }
    }
}
