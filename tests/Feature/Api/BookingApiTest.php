<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_bookings(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $booking = Booking::create([
            'user_id' => $admin->id,
            'type' => 'hotel',
            'item_slug' => 'grand-hotel',
            'items' => [['slug' => 'grand-hotel', 'id' => null, 'qty' => 1]],
            'client' => [
                'name' => 'Test Client',
                'email' => 'client@example.com',
            ],
            'total_amount' => 250,
            'status' => 'Pending',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/bookings')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $booking->id)
            ->assertJsonPath('0.status', 'Pending');
    }
}