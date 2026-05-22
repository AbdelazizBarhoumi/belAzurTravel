<?php

namespace Tests\Feature;

use App\Models\Flight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Comprehensive end-to-end test for admin flights CRUD, validation, persistence, and public retrieval.
 */
class AdminFlightsE2ETest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    /**
     * E2E: Create a flight with all localized and detail fields, verify DB persistence and retrieval.
     */
    public function test_create_flight_with_all_fields(): void
    {
        $payload = [
            'code' => 'test-e2e-create-'.time(),
            'airline_en' => 'Test Airline',
            'airline_fr' => 'Compagnie Test',
            'airline_ar' => 'خطوط الاختبار',
            'from' => 'NYC',
            'to_en' => 'Paris',
            'to_fr' => 'Paris',
            'to_ar' => 'باريس',
            'duration_en' => '7h 30m',
            'duration_fr' => '7h 30m',
            'duration_ar' => '٧ ساعات و ٣٠ دقيقة',
            'price' => 750,
            'stops_en' => 'Direct',
            'stops_fr' => 'Direct',
            'stops_ar' => 'مباشر',
            'departure' => '14:00',
            'arrival' => '22:30+1',
            'date' => 'June 1, 2026',
            'seats' => 250,
            'cabin_en' => 'Business',
            'cabin_fr' => 'Affaires',
            'cabin_ar' => 'الفئة الأولى',
            'aircraft_en' => 'Boeing 777',
            'aircraft_fr' => 'Boeing 777',
            'aircraft_ar' => 'بوينج 777',
            'baggage_en' => '2 checked bags + 1 carry-on',
            'baggage_fr' => '2 bagages en soute + 1 bagage cabine',
            'baggage_ar' => 'حقيبتان مسجلتان + حقيبة يد واحدة',
            'refund_en' => 'Refundable',
            'refund_fr' => 'Remboursable',
            'refund_ar' => 'قابل للاسترداد',
        ];

        // Step 1: Create flight via admin API
        $createResponse = $this->actingAs($this->admin)
            ->postJson('/api/admin/flights', $payload)
            ->assertCreated();

        $createdData = $createResponse->json('data');
        $this->assertNotNull($createdData['id']);
        $this->assertEquals($payload['code'], $createdData['code']);
        $this->assertEquals($payload['airline_en'], $createdData['airline']['en']);
        $this->assertEquals($payload['price'], $createdData['price']);

        // Step 2: Verify DB persistence - flight exists with correct columns
        $dbFlight = Flight::where('code', $createdData['code'])->first();
        $this->assertNotNull($dbFlight);
        $this->assertEquals($payload['code'], $dbFlight->code);
        $this->assertEquals($payload['price'], $dbFlight->price);
        $this->assertEquals($payload['from'], $dbFlight->from);
        $this->assertEquals($payload['departure'], $dbFlight->departure);
        $this->assertEquals($payload['arrival'], $dbFlight->arrival);

        // Verify localized fields stored as JSON
        $this->assertEquals($payload['airline_en'], $dbFlight->airline['en']);
        $this->assertEquals($payload['airline_fr'], $dbFlight->airline['fr']);
        $this->assertEquals($payload['airline_ar'], $dbFlight->airline['ar']);

        $this->assertEquals($payload['to_en'], $dbFlight->to['en']);
        $this->assertEquals($payload['to_fr'], $dbFlight->to['fr']);

        // Verify details fields
        $this->assertEquals($payload['date'], $dbFlight->details['date']);
        $this->assertEquals($payload['seats'], $dbFlight->details['seats']);
        $this->assertEquals($payload['cabin_en'], $dbFlight->details['cabin']['en']);
        $this->assertEquals($payload['aircraft_en'], $dbFlight->details['aircraft']['en']);
        $this->assertEquals($payload['baggage_en'], $dbFlight->details['baggage']['en']);
        $this->assertEquals($payload['refund_en'], $dbFlight->details['refund']['en']);

        // Step 3: Retrieve from admin API - verify nested payload
        $this->actingAs($this->admin)
            ->getJson("/api/admin/flights/{$dbFlight->id}")
            ->assertOk()
            ->assertJsonPath('data.code', $payload['code'])
            ->assertJsonPath('data.airline.en', $payload['airline_en'])
            ->assertJsonPath('data.airline.fr', $payload['airline_fr'])
            ->assertJsonPath('data.to.en', $payload['to_en'])
            ->assertJsonPath('data.to.fr', $payload['to_fr'])
            ->assertJsonPath('data.price', $payload['price'])
            ->assertJsonPath('data.details.date', $payload['date'])
            ->assertJsonPath('data.details.seats', $payload['seats'])
            ->assertJsonPath('data.details.cabin.en', $payload['cabin_en'])
            ->assertJsonPath('data.details.aircraft.en', $payload['aircraft_en'])
            ->assertJsonPath('data.details.baggage.en', $payload['baggage_en'])
            ->assertJsonPath('data.details.refund.en', $payload['refund_en']);

        // Step 4: Retrieve from public API - verify localized payload
        $publicResponse = $this->getJson("/api/flights/{$payload['code']}")
            ->assertOk();

        $publicData = $publicResponse->json();
        $this->assertEquals($payload['code'], $publicData['id']);
        $this->assertEquals($payload['airline_en'], $publicData['airline']['en']);
        $this->assertEquals($payload['from'], $publicData['from']);
        $this->assertEquals($payload['departure'], $publicData['departure']);
        $this->assertEquals($payload['date'], $publicData['details']['date']);
        $this->assertEquals($payload['cabin_en'], $publicData['details']['cabin']['en']);
        $this->assertEquals($payload['aircraft_en'], $publicData['details']['aircraft']['en']);
    }

    /**
     * E2E: Update a flight and verify changes persist in DB and are reflected in both admin and public APIs.
     */
    public function test_update_flight_persists_all_changes(): void
    {
        // Create initial flight
        $initialFlight = Flight::create([
            'code' => 'update-test-'.time(),
            'airline' => ['en' => 'Original Airline', 'fr' => 'Compagnie Originale', 'ar' => 'شركة أصلية'],
            'from' => 'NYC',
            'to' => ['en' => 'London', 'fr' => 'Londres', 'ar' => 'لندن'],
            'duration' => ['en' => '6h', 'fr' => '6h', 'ar' => '٦ ساعات'],
            'price' => 500,
            'stops' => ['en' => 'Direct', 'fr' => 'Direct', 'ar' => 'مباشر'],
            'departure' => '10:00',
            'arrival' => '16:00+1',
            'details' => [
                'date' => 'May 20, 2026',
                'seats' => 200,
                'cabin' => ['en' => 'Economy', 'fr' => 'Économie', 'ar' => 'اقتصادية'],
                'aircraft' => ['en' => 'Airbus A320', 'fr' => 'Airbus A320', 'ar' => 'إيرباص A320'],
                'baggage' => ['en' => '1 bag', 'fr' => '1 bagage', 'ar' => 'حقيبة واحدة'],
                'refund' => ['en' => 'Non-refundable', 'fr' => 'Non-remboursable', 'ar' => 'غير قابل للاسترداد'],
            ],
        ]);

        // Update flight with new values
        $updatePayload = [
            'code' => $initialFlight->code, // Keep code same
            'airline_en' => 'Updated Airline',
            'airline_fr' => 'Compagnie Mise à Jour',
            'airline_ar' => 'شركة محدثة',
            'from' => 'LAX',
            'to_en' => 'Tokyo',
            'to_fr' => 'Tokyo',
            'to_ar' => 'طوكيو',
            'duration_en' => '11h 30m',
            'duration_fr' => '11h 30m',
            'duration_ar' => '١١ ساعة و٣٠ دقيقة',
            'price' => 1200,
            'stops_en' => '1 stop',
            'stops_fr' => '1 escale',
            'stops_ar' => 'توقف واحد',
            'departure' => '22:00',
            'arrival' => '16:00+1',
            'date' => 'June 15, 2026',
            'seats' => 350,
            'cabin_en' => 'First',
            'cabin_fr' => 'Première',
            'cabin_ar' => 'الفئة الأولى',
            'aircraft_en' => 'Boeing 787',
            'aircraft_fr' => 'Boeing 787',
            'aircraft_ar' => 'بوينج 787',
            'baggage_en' => '3 bags + lounge',
            'baggage_fr' => '3 bagages + salon',
            'baggage_ar' => '3 حقائب + الراحة',
            'refund_en' => 'Fully refundable',
            'refund_fr' => 'Totalement remboursable',
            'refund_ar' => 'قابل للاسترداد بالكامل',
        ];

        // Step 1: Update via admin API
        $updateResponse = $this->actingAs($this->admin)
            ->putJson("/api/admin/flights/{$initialFlight->id}", $updatePayload)
            ->assertOk();

        $updatedData = $updateResponse->json('data');
        $this->assertEquals($updatePayload['airline_en'], $updatedData['airline']['en']);
        $this->assertEquals($updatePayload['price'], $updatedData['price']);

        // Step 2: Verify DB persistence
        $dbFlight = Flight::find($initialFlight->id);
        $this->assertEquals($updatePayload['from'], $dbFlight->from);
        $this->assertEquals($updatePayload['airline_en'], $dbFlight->airline['en']);
        $this->assertEquals($updatePayload['price'], $dbFlight->price);
        $this->assertEquals($updatePayload['seats'], $dbFlight->details['seats']);
        $this->assertEquals($updatePayload['cabin_en'], $dbFlight->details['cabin']['en']);
        $this->assertEquals($updatePayload['date'], $dbFlight->details['date']);

        // Step 3: Verify public API reflects changes
        $publicResponse = $this->getJson("/api/flights/{$initialFlight->code}")
            ->assertOk();

        $publicData = $publicResponse->json();
        $this->assertEquals($updatePayload['airline_en'], $publicData['airline']['en']);
        $this->assertEquals($updatePayload['from'], $publicData['from']);
        $this->assertEquals($updatePayload['price'], $publicData['price']);
        $this->assertEquals($updatePayload['date'], $publicData['details']['date']);
        $this->assertEquals($updatePayload['seats'], $publicData['details']['seats']);
    }

    /**
     * E2E: Update a flight when localized fields arrive as nested objects from the admin form.
     */
    public function test_update_flight_accepts_nested_localized_payload(): void
    {
        $flight = Flight::create([
            'code' => 'nested-update-'.time(),
            'airline' => ['en' => 'Original Airline', 'fr' => 'Compagnie Originale', 'ar' => 'شركة أصلية'],
            'from' => 'PAR',
            'to' => ['en' => 'Rome', 'fr' => 'Rome', 'ar' => 'روما'],
            'duration' => ['en' => '2h', 'fr' => '2h', 'ar' => 'ساعتان'],
            'price' => 320,
            'stops' => ['en' => 'Direct', 'fr' => 'Direct', 'ar' => 'مباشر'],
            'departure' => '08:00',
            'arrival' => '10:00',
            'details' => [
                'date' => 'May 25, 2026',
                'seats' => 140,
                'cabin' => ['en' => 'Economy', 'fr' => 'Économie', 'ar' => 'اقتصادية'],
                'aircraft' => ['en' => 'Airbus A320', 'fr' => 'Airbus A320', 'ar' => 'إيرباص A320'],
                'baggage' => ['en' => '1 bag', 'fr' => '1 bagage', 'ar' => 'حقيبة واحدة'],
                'refund' => ['en' => 'Non-refundable', 'fr' => 'Non remboursable', 'ar' => 'غير قابل للاسترداد'],
            ],
        ]);

        $payload = [
            'code' => $flight->code,
            'airline' => [
                'en' => 'Updated Airline',
                'fr' => 'Compagnie Mise à Jour',
                'ar' => 'شركة محدثة',
            ],
            'airline_en' => 'Updated Airline',
            'airline_fr' => 'Compagnie Mise à Jour',
            'airline_ar' => 'شركة محدثة',
            'from' => 'LHR',
            'to' => [
                'en' => 'Berlin',
                'fr' => 'Berlin',
                'ar' => 'برلين',
            ],
            'to_en' => 'Berlin',
            'to_fr' => 'Berlin',
            'to_ar' => 'برلين',
            'duration' => [
                'en' => '2h 15m',
                'fr' => '2h 15m',
                'ar' => 'ساعتان و 15 دقيقة',
            ],
            'duration_en' => '2h 15m',
            'duration_fr' => '2h 15m',
            'duration_ar' => 'ساعتان و 15 دقيقة',
            'price' => 360,
            'stops' => [
                'en' => 'Direct',
                'fr' => 'Direct',
                'ar' => 'مباشر',
            ],
            'stops_en' => 'Direct',
            'stops_fr' => 'Direct',
            'stops_ar' => 'مباشر',
            'departure' => '09:30',
            'arrival' => '11:45',
            'date' => 'June 20, 2026',
            'seats' => 150,
            'cabin' => [
                'en' => 'Business',
                'fr' => 'Affaires',
                'ar' => 'أعمال',
            ],
            'cabin_en' => 'Business',
            'cabin_fr' => 'Affaires',
            'cabin_ar' => 'أعمال',
            'aircraft' => [
                'en' => 'Boeing 737',
                'fr' => 'Boeing 737',
                'ar' => 'بوينج 737',
            ],
            'aircraft_en' => 'Boeing 737',
            'aircraft_fr' => 'Boeing 737',
            'aircraft_ar' => 'بوينج 737',
            'baggage' => [
                'en' => '2 bags',
                'fr' => '2 bagages',
                'ar' => 'حقيبتان',
            ],
            'baggage_en' => '2 bags',
            'baggage_fr' => '2 bagages',
            'baggage_ar' => 'حقيبتان',
            'refund' => [
                'en' => 'Refundable',
                'fr' => 'Remboursable',
                'ar' => 'قابل للاسترداد',
            ],
            'refund_en' => 'Refundable',
            'refund_fr' => 'Remboursable',
            'refund_ar' => 'قابل للاسترداد',
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/flights/{$flight->id}", $payload)
            ->assertOk();

        $response->assertJsonPath('data.airline.en', 'Updated Airline');
        $response->assertJsonPath('data.to.en', 'Berlin');
        $response->assertJsonPath('data.details.cabin.en', 'Business');

        $this->assertDatabaseHas('flights', [
            'id' => $flight->id,
            'code' => $flight->code,
            'from' => 'LHR',
            'departure' => '09:30',
            'arrival' => '11:45',
            'price' => 360,
        ]);

        $updated = Flight::findOrFail($flight->id);
        $this->assertEquals('Updated Airline', $updated->airline['en']);
        $this->assertEquals('Berlin', $updated->to['en']);
        $this->assertEquals('Business', $updated->details['cabin']['en']);
        $this->assertEquals('Boeing 737', $updated->details['aircraft']['en']);
        $this->assertEquals('Refundable', $updated->details['refund']['en']);
    }

    /**
     * E2E: Delete a flight and verify it's removed from DB and public API returns 404.
     */
    public function test_delete_flight_removes_from_db_and_public_api(): void
    {
        $flight = Flight::create([
            'code' => 'delete-test-'.time(),
            'airline' => ['en' => 'Test', 'fr' => 'Test', 'ar' => 'اختبار'],
            'from' => 'NYC',
            'to' => ['en' => 'Paris', 'fr' => 'Paris', 'ar' => 'باريس'],
            'duration' => ['en' => '7h', 'fr' => '7h', 'ar' => '٧ ساعات'],
            'price' => 700,
            'stops' => ['en' => 'Direct', 'fr' => 'Direct', 'ar' => 'مباشر'],
            'departure' => '14:00',
            'arrival' => '22:00+1',
            'details' => [],
        ]);

        // Verify exists in public API
        $this->getJson("/api/flights/{$flight->code}")->assertOk();

        // Step 1: Delete via admin API
        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/flights/{$flight->id}")
            ->assertOk()
            ->assertJson(['message' => 'deleted']);

        // Step 2: Verify DB deletion
        $this->assertNull(Flight::find($flight->id));

        // Step 3: Verify public API returns 404
        $this->getJson("/api/flights/{$flight->code}")->assertNotFound();
    }

    /**
     * E2E: Validate required and optional fields at API boundary.
     */
    public function test_validation_rejects_invalid_payloads(): void
    {
        // All fields are optional in backend, but can send empty payload
        $this->actingAs($this->admin)
            ->postJson('/api/admin/flights', ['code' => 'empty-'.time()])
            ->assertCreated(); // Even with minimal payload, create succeeds

        // Invalid price (negative)
        $this->actingAs($this->admin)
            ->postJson('/api/admin/flights', [
                'airline_en' => 'Test',
                'from' => 'NYC',
                'to_en' => 'Paris',
                'price' => -100,
            ])
            ->assertStatus(422);

        // Invalid seats (negative)
        $this->actingAs($this->admin)
            ->postJson('/api/admin/flights', [
                'airline_en' => 'Test',
                'from' => 'NYC',
                'to_en' => 'Paris',
                'price' => 500,
                'seats' => -50,
            ])
            ->assertStatus(422);
    }

    /**
     * E2E: Verify authorization - non-admin cannot create/update/delete flights.
     */
    public function test_non_admin_cannot_modify_flights(): void
    {
        $client = User::factory()->create(['role' => 'client', 'active' => true]);

        $this->actingAs($client)
            ->postJson('/api/admin/flights', ['airline_en' => 'Test', 'from' => 'NYC'])
            ->assertForbidden();

        $this->actingAs($client)
            ->getJson('/api/admin/flights')
            ->assertForbidden();
    }

    /**
     * E2E: Verify list endpoint returns correct admin payload format.
     */
    public function test_list_flights_returns_admin_payload_format(): void
    {
        Flight::create([
            'code' => 'list-test-1-'.time(),
            'airline' => ['en' => 'Airline 1', 'fr' => 'Compagnie 1', 'ar' => 'خطوط 1'],
            'from' => 'NYC',
            'to' => ['en' => 'Paris', 'fr' => 'Paris', 'ar' => 'باريس'],
            'duration' => ['en' => '7h', 'fr' => '7h', 'ar' => '٧ ساعات'],
            'price' => 600,
            'stops' => ['en' => 'Direct', 'fr' => 'Direct', 'ar' => 'مباشر'],
            'departure' => '10:00',
            'arrival' => '18:00+1',
            'details' => ['cabin' => ['en' => 'Economy', 'fr' => 'Économie', 'ar' => 'اقتصادية']],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/flights')
            ->assertOk();

        $flights = $response->json('data');
        $this->assertIsArray($flights);
        $this->assertNotEmpty($flights);

        $flight = $flights[0];
        // Verify admin payload format (matches public API nested structure)
        $this->assertArrayHasKey('id', $flight);
        $this->assertArrayHasKey('code', $flight);
        $this->assertArrayHasKey('airline', $flight);
        $this->assertIsArray($flight['airline']);
        $this->assertArrayHasKey('en', $flight['airline']);
        $this->assertArrayHasKey('to', $flight);
        $this->assertArrayHasKey('price', $flight);
        $this->assertArrayHasKey('details', $flight);
        $this->assertArrayHasKey('cabin', $flight['details']);
    }
}
