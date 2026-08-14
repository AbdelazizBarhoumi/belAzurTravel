<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

/**
 * Phase F cancellation: preview fees (PreCancelled), confirm cancel, and the
 * provider `Cancelled`/`Rejected`/`OnRequest` state mapping to local statuses.
 * The client dashboard and admin ops must expose the provider reference.
 */
class CancellationFlowTest extends TestCase
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
        Cache::flush();

        $this->client = User::factory()->create(['role' => 'client', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function confirmedProviderBooking(array $overrides = []): Booking
    {
        return Booking::create(array_merge([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1113,
            'status' => 'Confirmed',
            'provider_booking_id' => '98765',
            'provider_booking_reference' => 'VOUCH-98765',
            'provider_payload' => [
                'request' => [
                    'Id' => 98765,
                    'Hotel' => 100,
                    'City' => 10,
                    'Token' => 'eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=',
                    'CheckIn' => now()->addDays(10)->toDateString(),
                    'CheckOut' => now()->addDays(14)->toDateString(),
                ],
            ],
        ], $overrides));
    }

    public function test_cancel_previews_fees_then_confirms_provider_cancellation(): void
    {
        $booking = $this->confirmedProviderBooking();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::sequence()
                ->push($this->osTravelFixture('booking_cancellation_preview'))
                ->push($this->osTravelFixture('booking_cancellation_confirm')),
        ]);

        $cancelled = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk()
            ->json();

        // The preview fees (PreCancelled step) are surfaced alongside the
        // confirmed cancellation.
        $this->assertSame(185.5, $cancelled['cancellation_penalty'][0]['Fees']);
        $this->assertSame('Cancelled', $cancelled['status']);
        $this->assertSame('Cancelled', $cancelled['provider_status']);
        $this->assertNotNull($cancelled['cancelled_at']);
        $this->assertSame('VOUCH-98765', $cancelled['provider_booking_reference']);
    }

    public function test_cancellation_state_maps_rejected_to_confirmed(): void
    {
        $booking = $this->confirmedProviderBooking();

        $rejected = $this->osTravelFixture('booking_cancellation_confirm');
        $rejected['BookingCancellation']['State'] = 'Rejected';

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::sequence()
                ->push($this->osTravelFixture('booking_cancellation_preview'))
                ->push($rejected),
        ]);

        $response = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk()
            ->json();

        // A rejected cancellation must NOT downgrade a Confirmed booking.
        $this->assertSame('Confirmed', $response['status']);
        $this->assertSame('Confirmed', $response['provider_status']);
        $this->assertNull($response['cancelled_at']);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'Confirmed',
            'cancelled_at' => null,
        ]);
    }

    public function test_cancellation_state_maps_on_request_to_pending(): void
    {
        $booking = $this->confirmedProviderBooking();

        $onRequest = $this->osTravelFixture('booking_cancellation_confirm');
        $onRequest['BookingCancellation']['State'] = 'OnRequest';

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::sequence()
                ->push($this->osTravelFixture('booking_cancellation_preview'))
                ->push($onRequest),
        ]);

        $response = $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertOk()
            ->json();

        $this->assertSame('Pending', $response['status']);
        $this->assertSame('Pending', $response['provider_status']);
        $this->assertNull($response['cancelled_at']);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'Pending',
            'cancelled_at' => null,
        ]);
    }

    public function test_cancel_preview_failure_blocks_cancellation(): void
    {
        $booking = $this->confirmedProviderBooking();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCancellation' => Http::sequence()
                ->push($this->osTravelFixture('error_invalid_credentials'))
                ->push($this->osTravelFixture('booking_cancellation_confirm')),
        ]);

        $this->actingAs($this->client)
            ->postJson("/api/bookings/{$booking->id}/cancel")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cancellation');

        // The booking is untouched when the preview cannot be computed.
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'Confirmed',
        ]);
    }

    public function test_admin_booking_list_exposes_provider_reference(): void
    {
        $booking = $this->confirmedProviderBooking();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/bookings')
            ->assertOk();

        $row = collect($response->json())->firstWhere('id', $booking->id);
        $this->assertNotNull($row);
        $this->assertSame('Confirmed', $row['status']);
        $this->assertSame('98765', $row['provider_booking_id']);
        $this->assertSame('VOUCH-98765', $row['provider_booking_reference']);
        $this->assertSame(1113, $row['total_amount']);
    }

    public function test_client_dashboard_lists_confirmed_booking_and_cancel_window(): void
    {
        $booking = $this->confirmedProviderBooking();

        $dashboard = $this->actingAs($this->client)
            ->getJson('/api/client/bookings')
            ->assertOk()
            ->json();

        $row = collect($dashboard)->firstWhere('id', $booking->id);
        $this->assertNotNull($row);
        $this->assertSame('Confirmed', $row['status']);
        $this->assertTrue($row['can_cancel']);
        $this->assertNull($row['cancel_reason']);
    }
}