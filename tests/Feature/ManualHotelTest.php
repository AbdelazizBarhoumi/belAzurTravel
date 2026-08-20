<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class ManualHotelTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    private User $client;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpOsTravelConfig();
        Storage::fake('public');
        $this->client = User::factory()->create(['role' => 'client', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        Cache::flush();
    }

    private function manualHotelPayload(array $overrides = []): array
    {
        return array_merge([
            'name_en' => 'Maison de la Plage',
            'name_fr' => 'Maison de la Plage',
            'name_ar' => 'منزل الشاطئ',
            'location_en' => 'Sousse',
            'location_fr' => 'Sousse',
            'location_ar' => 'سوسة',
            'category_key' => 'beach',
            'category_en' => 'Beach',
            'category_fr' => 'Plage',
            'category_ar' => 'شاطئ',
            'city_en' => 'Sousse',
            'city_fr' => 'Sousse',
            'city_ar' => 'سوسة',
            'country_en' => 'Tunisia',
            'country_fr' => 'Tunisie',
            'country_ar' => 'تونس',
            'destination_slug' => 'sousse',
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'stars' => 3,
            'image' => 'https://example.com/manual.jpg',
            'source' => 'manual',
            'booking_mode' => 'instant',
        ], $overrides);
    }

    public function test_admin_can_create_a_manual_hotel(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/hotels', $this->manualHotelPayload())
            ->assertStatus(201);

        $this->assertSame('manual', $response->json('data.source'));
        $this->assertSame('instant', $response->json('data.booking_mode'));

        $this->assertDatabaseHas('hotels', [
            'slug' => $response->json('data.slug'),
            'source' => 'manual',
            'booking_mode' => 'instant',
        ]);
    }

    public function test_manual_hotel_appears_in_public_search(): void
    {
        $hotel = Hotel::create([
            'slug' => 'maison-de-la-plage',
            'code' => 'hotel-maison-001',
            'name' => ['en' => 'Maison de la Plage', 'fr' => 'Maison de la Plage', 'ar' => 'منزل الشاطئ'],
            'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.0,
            'stars' => 3,
            'reviews' => 5,
            'image' => 'https://example.com/manual.jpg',
            'source' => 'manual',
            'booking_mode' => 'instant',
        ]);

        Http::fake([
            'https://admin.mygo.co/api/hotel/HotelSearch' => Http::response(['HotelSearch' => [], 'CountResults' => 0]),
        ]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/hotels/search', [
                'check_in' => '2026-09-01',
                'check_out' => '2026-09-08',
                'hotel_slugs' => ['maison-de-la-plage'],
            ])
            ->assertOk();

        $results = collect($response->json('data'));
        $manual = $results->firstWhere('slug', 'maison-de-la-plage');
        $this->assertNotNull($manual);
        $this->assertSame('manual', $manual['provider']);
        $this->assertTrue($manual['available']);
        $this->assertSame(840, $manual['price']);
        // Manual-only search never touched the provider.
        Http::assertNothingSent();
    }

    public function test_manual_instant_booking_stays_pending_until_admin_approves(): void
    {
        Hotel::create([
            'slug' => 'maison-de-la-plage',
            'code' => 'hotel-maison-001',
            'name' => ['en' => 'Maison de la Plage', 'fr' => 'Maison de la Plage', 'ar' => 'منزل الشاطئ'],
            'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.0,
            'stars' => 3,
            'reviews' => 5,
            'image' => 'https://example.com/manual.jpg',
            'source' => 'manual',
            'booking_mode' => 'instant',
        ]);

        Http::fake();

        $response = $this->actingAs($this->client)
            ->postJson('/api/bookings', [
                'type' => 'hotel',
                'item_slug' => 'maison-de-la-plage',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-05',
                'client' => [
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                    'phone' => '123456789',
                ],
                'amount' => 480,
            ])
            ->assertStatus(201);

        // All types go through admin approval now — no instant auto-confirm.
        $this->assertSame('Pending', $response->json('status'));
        $this->assertNull($response->json('confirmed_at'));
        $this->assertNotNull($response->json('expires_at'));
        $this->assertNull($response->json('provider_booking_id'));
        $this->assertSame(480, $response->json('total_amount'));

        // A manual booking never calls the provider.
        Http::assertNothingSent();

        $booking = Booking::findOrFail($response->json('id'));
        $this->assertNull($booking->confirmed_at);
        // No fabricated "paid" record until the gateway is back.
        $this->assertDatabaseMissing('payments', ['booking_id' => $booking->id]);

        // Admin approval confirms the reservation locally.
        $approved = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/approve")
            ->assertOk();

        $this->assertSame('Confirmed', $approved->json('status'));
        $this->assertDatabaseMissing('payments', ['booking_id' => $booking->id]);
    }

    public function test_manual_request_booking_stays_pending_until_admin_confirms(): void
    {
        Hotel::create([
            'slug' => 'maison-de-la-plage',
            'code' => 'hotel-maison-001',
            'name' => ['en' => 'Maison de la Plage', 'fr' => 'Maison de la Plage', 'ar' => 'منزل الشاطئ'],
            'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.0,
            'stars' => 3,
            'reviews' => 5,
            'image' => 'https://example.com/manual.jpg',
            'source' => 'manual',
            'booking_mode' => 'request',
        ]);

        Http::fake();

        $response = $this->actingAs($this->client)
            ->postJson('/api/bookings', [
                'type' => 'hotel',
                'item_slug' => 'maison-de-la-plage',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-05',
                'client' => [
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                    'phone' => '123456789',
                ],
                'amount' => 480,
            ])
            ->assertStatus(201);

        $this->assertSame('Pending', $response->json('status'));
        $this->assertNull($response->json('confirmed_at'));
        Http::assertNothingSent();

        $id = $response->json('id');

        // Admin approves the request-mode booking locally (no provider call).
        $confirmed = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$id}/approve")
            ->assertOk();

        $this->assertSame('Confirmed', $confirmed->json('status'));
        Http::assertNothingSent();

        // No payment row is fabricated on approval.
        $this->assertDatabaseMissing('payments', [
            'booking_id' => $id,
        ]);
    }

    public function test_manual_booking_cancels_locally_without_provider(): void
    {
        $hotel = Hotel::create([
            'slug' => 'maison-de-la-plage',
            'code' => 'hotel-maison-001',
            'name' => ['en' => 'Maison de la Plage', 'fr' => 'Maison de la Plage', 'ar' => 'منزل الشاطئ'],
            'location' => ['en' => 'Sousse', 'fr' => 'Sousse', 'ar' => 'سوسة'],
            'price' => 120,
            'base_price' => 100,
            'markup_percentage' => 20,
            'currency' => 'TND',
            'rating' => 4.0,
            'stars' => 3,
            'reviews' => 5,
            'image' => 'https://example.com/manual.jpg',
            'source' => 'manual',
            'booking_mode' => 'instant',
        ]);

        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => $hotel->slug,
            'items' => [['slug' => $hotel->slug, 'qty' => 1]],
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 480,
            'status' => 'Confirmed',
        ]);

        Http::fake();

        $response = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk();

        $this->assertSame('Cancelled', $response->json('status'));
        Http::assertNothingSent();
    }
}
