<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\Car;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Tour;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

/**
 * Phase 1: the demand approval pipeline. Every reservation lands `pending`,
 * admin approve/reject drive confirmation, provider hotels are re-prebooked
 * on approve, and `bookings:expire` cleans stale demands.
 */
class BookingApprovalFlowTest extends TestCase
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

    private function providerBookingPayload(): array
    {
        return [
            'City' => 10,
            'Hotel' => 100,
            'CheckIn' => '2026-09-01',
            'CheckOut' => '2026-09-05',
            'Source' => 'OS-TRAVEL-DIRECT',
            'Token' => 'eyJ0b2tlbiI6InRlc3QtY2FwLWJvbi1rZWxpYmlhIn0=',
            'Rooms' => [
                [
                    'Id' => 501,
                    'Boarding' => 4,
                    'View' => [1],
                    'Supplement' => [],
                    'Pax' => [
                        'Adult' => [
                            ['Civility' => 'Mr', 'Name' => 'John', 'Surname' => 'Doe', 'Holder' => true],
                        ],
                        'Child' => [],
                    ],
                ],
            ],
        ];
    }

    private function providerBooking(array $overrides = []): Booking
    {
        return Booking::create(array_merge([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => 'cap-bon-kelibia',
            'items' => [['slug' => 'cap-bon-kelibia', 'qty' => 1]],
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-05',
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1113,
            'status' => 'Pending',
            'provider_payload' => ['request' => $this->providerBookingPayload()],
        ], $overrides));
    }

    public function test_every_booking_type_lands_pending(): void
    {
        Http::fake();

        Destination::factory()->create(['slug' => 'paris']);
        Tour::factory()->create(['slug' => 'tour-omra-2026']);
        Flight::create([
            'code' => 'TU712',
            'airline' => ['en' => 'Tunisair', 'fr' => 'Tunisair', 'ar' => 'تونيستار'],
            'from' => 'TUN',
            'to' => ['en' => 'Jeddah', 'fr' => 'Djeddah', 'ar' => 'جدة'],
            'duration' => ['en' => '4h', 'fr' => '4h', 'ar' => '٤ ساعات'],
            'stops' => [],
            'departure' => '10:00',
            'arrival' => '14:00',
            'price' => 900,
        ]);
        Car::factory()->create(['slug' => 'car-4x4']);

        $types = [
            ['destination', 'paris'],
            ['tour', 'tour-omra-2026'],
            ['flight', 'TU712'],
            ['car', 'car-4x4'],
        ];

        foreach ($types as [$type, $identifier]) {
            $response = $this->actingAs($this->client)
                ->postJson('/api/bookings', [
                    'type' => $type,
                    'item_slug' => $identifier,
                    'start_date' => '2026-10-01',
                    'end_date' => '2026-10-03',
                    'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
                    'amount' => 500,
                ])
                ->assertStatus(201);

            $this->assertSame('Pending', $response->json('status'));
            $this->assertNotNull($response->json('expires_at'));
            $this->assertDatabaseHas('bookings', [
                'id' => $response->json('id'),
                'status' => 'Pending',
            ]);
        }

        Http::assertNothingSent();
    }

    public function test_approve_confirms_and_records_audit_trail(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'tour',
            'item_slug' => 'tour-omra-2026',
            'items' => [['slug' => 'tour-omra-2026', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/approve")
            ->assertOk();

        $this->assertSame('Confirmed', $response->json('status'));
        $this->assertNotNull($response->json('confirmed_at'));

        $audits = BookingAudit::query()->where('booking_id', $booking->id)->orderBy('id')->get();
        $this->assertSame(['approved', 'confirmed'], $audits->map(fn ($a) => $a->action)->all());
        $this->assertSame('Approved', $audits[0]->to_status->value);
        $this->assertSame('Confirmed', $audits[1]->to_status->value);
        $this->assertSame($this->admin->id, $audits[1]->actor_id);
    }

    public function test_approve_rejects_already_final_state(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'tour',
            'item_slug' => 'tour-omra-2026',
            'items' => [['slug' => 'tour-omra-2026', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1000,
            'status' => 'Confirmed',
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/approve")
            ->assertStatus(422);
    }

    public function test_reject_requires_a_reason(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'tour',
            'item_slug' => 'tour-omra-2026',
            'items' => [['slug' => 'tour-omra-2026', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/reject")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'Pending']);
    }

    public function test_reject_sets_reason_and_notifies_both_sides(): void
    {
        Notification::fake();

        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'tour',
            'item_slug' => 'tour-omra-2026',
            'items' => [['slug' => 'tour-omra-2026', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/reject", ['reason' => 'Fully booked for those dates'])
            ->assertOk();

        $this->assertSame('Rejected', $response->json('status'));
        $this->assertSame('Fully booked for those dates', $response->json('reject_reason'));
        $this->assertNotNull($response->json('rejected_at'));

        $audit = BookingAudit::query()->where('booking_id', $booking->id)->first();
        $this->assertSame('rejected', $audit->action);
        $this->assertSame('Fully booked for those dates', $audit->notes);

        Notification::assertSentTo($this->client, BookingStatusNotification::class);
        Notification::assertSentTo(
            $this->admin,
            BookingActivityNotification::class,
            fn ($n) => $n->toDatabase($this->admin)['type'] === 'booking.rejected'
        );
    }

    public function test_approve_provider_hotel_reprebooks_then_confirms(): void
    {
        $booking = $this->providerBooking();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::sequence()
                ->push($this->osTravelFixture('booking_creation_prebook'))
                ->push($this->osTravelFixture('booking_creation_confirm')),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/approve")
            ->assertOk();

        $this->assertSame('Confirmed', $response->json('status'));
        $this->assertSame('98765', $response->json('provider_booking_id'));
        $this->assertSame('VOUCH-98765', $response->json('provider_booking_reference'));

        $audits = BookingAudit::query()->where('booking_id', $booking->id)->orderBy('id')->get();
        $this->assertSame(['approved', 'confirmed'], $audits->map(fn ($a) => $a->action)->all());
    }

    public function test_approve_provider_hotel_with_stale_token_stays_pending(): void
    {
        $booking = $this->providerBooking();

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::response($this->osTravelFixture('error_invalid_credentials')),
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/approve")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('provider');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'Pending',
            'provider_booking_id' => null,
        ]);

        // The failed attempt is on the audit trail for the admin to see.
        $audit = BookingAudit::query()->where('booking_id', $booking->id)->first();
        $this->assertSame('updated', $audit->action);
        $this->assertStringContainsString('re-search', $audit->notes);
    }

    public function test_approve_provider_hotel_on_request_stays_approved(): void
    {
        Notification::fake();

        $booking = $this->providerBooking();

        $onRequest = $this->osTravelFixture('booking_creation_confirm');
        $onRequest['BookingCreation']['State'] = 'OnRequest';
        unset($onRequest['BookingCreation']['Id'], $onRequest['BookingCreation']['Voucher']);

        Http::fake([
            'https://admin.mygo.co/api/hotel/BookingCreation' => Http::sequence()
                ->push($this->osTravelFixture('booking_creation_prebook'))
                ->push($onRequest),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/approve")
            ->assertOk();

        $this->assertSame('Approved', $response->json('status'));
        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'Approved']);

        Notification::assertSentTo(
            $this->admin,
            BookingActivityNotification::class,
            fn ($n) => $n->toDatabase($this->admin)['type'] === 'booking.approved'
        );
    }

    public function test_expiry_command_expires_stale_pending_bookings(): void
    {
        Notification::fake();

        $expired = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => 'luxury-resort',
            'items' => [['slug' => 'luxury-resort', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
            'expires_at' => now()->subHour(),
        ]);

        $kept = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'hotel',
            'item_slug' => 'luxury-resort',
            'items' => [['slug' => 'luxury-resort', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1000,
            'status' => 'Pending',
            'expires_at' => now()->addDay(),
        ]);

        $this->artisan('bookings:expire')->assertSuccessful();

        $this->assertDatabaseHas('bookings', ['id' => $expired->id, 'status' => 'Expired']);
        $this->assertDatabaseHas('bookings', ['id' => $kept->id, 'status' => 'Pending']);

        $audit = BookingAudit::query()->where('booking_id', $expired->id)->first();
        $this->assertSame('expired', $audit->action);
        $this->assertNull($audit->actor_id);

        Notification::assertSentTo($this->client, BookingStatusNotification::class);
        Notification::assertSentTo(
            $this->admin,
            BookingActivityNotification::class,
            fn ($n) => $n->toDatabase($this->admin)['type'] === 'booking.expired'
        );
    }

    public function test_confirm_route_still_works_as_approve_alias(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'type' => 'destination',
            'item_slug' => 'paris',
            'items' => [['slug' => 'paris', 'qty' => 1]],
            'client' => ['name' => 'John Doe', 'email' => 'john@example.com'],
            'total_amount' => 1500,
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/confirm")
            ->assertOk();

        $this->assertSame('Confirmed', $response->json('status'));
    }
}
