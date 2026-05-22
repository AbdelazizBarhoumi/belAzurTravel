<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\SupportInquiry;
use App\Models\User;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $clients = User::query()->where('role', 'client')->get()->values();

        foreach ([
            ['Sarah Johnson', 'destination', 'santorini', 2450, 'Confirmed', '2026-02-20'],
            ['Mike Chen', 'hotel', 'marina-bay-suites', 1890, 'Pending', '2026-02-19'],
            ['Emma Davis', 'tour', 'bali-cultural-immersion', 3200, 'Confirmed', '2026-02-18'],
            ['James Wilson', 'destination', 'dubai', 2100, 'Cancelled', '2026-02-17'],
            ['Lisa Brown', 'hotel', 'grand-parisien', 1599, 'Confirmed', '2026-02-16'],
        ] as $index => [$name, $type, $slug, $amount, $status, $createdAt]) {
            Booking::query()->updateOrCreate(['type' => $type, 'item_slug' => $slug], [
                'user_id' => $clients->get($index)?->id,
                'type' => $type,
                'item_slug' => $slug,
                'items' => [['slug' => $slug, 'qty' => 1]],
                'client' => ['name' => $name, 'email' => strtolower(str_replace(' ', '.', $name)).'@example.com'],
                'total_amount' => $amount,
                'status' => $status,
                'confirmed_at' => $status === 'Confirmed' ? now() : null,
                'cancelled_at' => $status === 'Cancelled' ? now() : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        foreach ([
            ['Sarah Johnson', 'Room upgrade request for Santorini booking', 'I would like to know if a suite upgrade is available.', 'new', 'high'],
            ['Mike Chen', 'Flight change inquiry for Bali trip', 'Can you help me move my departure by one day?', 'in-progress', 'medium'],
            ['Emma Davis', 'Cancel and refund request', 'Please explain the cancellation options for my booking.', 'new', 'high'],
            ['James Wilson', 'Visa assistance needed for Dubai', 'Do I need visa support for this itinerary?', 'resolved', 'low'],
            ['Lisa Brown', 'Special dietary requirements for tour', 'Please add vegetarian meals to my group tour.', 'in-progress', 'medium'],
        ] as [$client, $subject, $message, $status, $priority]) {
            $inquiry = SupportInquiry::query()
                ->where('client->name', $client)
                ->where('subject->en', $subject)
                ->first();

            $payload = [
                'user_id' => User::query()->where('name', $client)->value('id'),
                'client' => ['name' => $client, 'email' => strtolower(str_replace(' ', '.', $client)).'@example.com'],
                'subject' => ['en' => $subject, 'fr' => $subject, 'ar' => $subject],
                'message' => ['en' => $message, 'fr' => $message, 'ar' => $message],
                'status' => $status,
                'priority' => $priority,
                'resolved_at' => $status === 'resolved' ? now() : null,
            ];

            $inquiry ? $inquiry->update($payload) : SupportInquiry::query()->create($payload);
        }
    }
}
