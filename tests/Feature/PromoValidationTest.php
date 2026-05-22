<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Promo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromoValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_valid_promo_is_accepted()
    {
        $promo = Promo::create([
            'code' => 'SAVE10',
            'title' => ['en' => 'Save 10'],
            'discount' => ['en' => '10%'],
            'color' => 'blue',
            'details' => ['active' => true, 'applicable_to' => 'all'],
        ]);

        Hotel::create([
            'slug' => 'hotel-1',
            'code' => 'hotel-1',
            'name' => ['en' => 'Test Hotel'],
            'location' => ['en' => 'Test Location'],
            'category' => ['en' => 'Test Category'],
            'price' => 100,
            'image' => '/storage/uploads/seed/hotel-default.jpg',
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'type' => 'hotel',
            'item_id' => 'hotel-1',
            'client' => ['name' => 'John', 'email' => 'john@example.com'],
            'amount' => 100,
            'promo_code' => 'SAVE10',
        ]);

        $response->assertStatus(201);
    }

    public function test_inactive_promo_is_rejected()
    {
        Promo::create([
            'code' => 'INACTIVE',
            'title' => ['en' => 'Inactive'],
            'discount' => ['en' => '10%'],
            'color' => 'red',
            'details' => ['active' => false],
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'type' => 'hotel',
            'item_id' => 'hotel-1',
            'client' => ['name' => 'John', 'email' => 'john@example.com'],
            'amount' => 100,
            'promo_code' => 'INACTIVE',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['promo_code']);
    }

    public function test_inapplicable_promo_is_rejected()
    {
        Promo::create([
            'code' => 'FLIGHTONLY',
            'title' => ['en' => 'Flight Only'],
            'discount' => ['en' => '10%'],
            'color' => 'green',
            'details' => ['active' => true, 'applicable_to' => 'flight'],
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'type' => 'hotel',
            'item_id' => 'hotel-1',
            'client' => ['name' => 'John', 'email' => 'john@example.com'],
            'amount' => 100,
            'promo_code' => 'FLIGHTONLY',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['promo_code']);
    }

    public function test_usage_limit_is_enforced()
    {
        Promo::create([
            'code' => 'LIMIT1',
            'title' => ['en' => 'Limit 1'],
            'discount' => ['en' => '10%'],
            'color' => 'blue',
            'details' => ['active' => true, 'applicable_to' => 'all', 'usage_limit' => 1],
        ]);

        // Use the limit
        Booking::create([
            'user_id' => User::factory()->create()->id,
            'type' => 'hotel',
            'client' => ['name' => 'User', 'email' => 'u@e.com'],
            'total_amount' => 100,
            'promo_code' => 'LIMIT1',
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'type' => 'hotel',
            'item_id' => 'hotel-1',
            'client' => ['name' => 'John', 'email' => 'john@example.com'],
            'amount' => 100,
            'promo_code' => 'LIMIT1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['promo_code']);
    }

    public function test_per_user_limit_is_enforced()
    {
        Promo::create([
            'code' => 'USERLIMIT',
            'title' => ['en' => 'User Limit'],
            'discount' => ['en' => '10%'],
            'color' => 'blue',
            'details' => ['active' => true, 'applicable_to' => 'all', 'per_user_limit' => 1],
        ]);

        // Use the limit
        Booking::create([
            'user_id' => $this->user->id,
            'type' => 'hotel',
            'client' => ['name' => 'John', 'email' => 'john@example.com'],
            'total_amount' => 100,
            'promo_code' => 'USERLIMIT',
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'type' => 'hotel',
            'item_id' => 'hotel-1',
            'client' => ['name' => 'John', 'email' => 'john@example.com'],
            'amount' => 100,
            'promo_code' => 'USERLIMIT',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['promo_code']);
    }
}
