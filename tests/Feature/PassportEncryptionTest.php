<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Models\Visa;
use App\Models\VisaApplication;
use App\Notifications\VisaApplicationNotification;
use App\Security\PassportVault;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PassportEncryptionTest extends TestCase
{
    use RefreshDatabase;

    private const SCAN = "%PDF-1.4 fake passport scan X1234567\n";

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');
        Notification::fake();
    }

    private function visa(): Visa
    {
        return Visa::query()->create([
            'code' => 'FR', 'name' => ['fr' => 'France', 'en' => 'France'], 'flag' => 'FR',
            'processing' => ['fr' => '15 jours'], 'price' => 250, 'is_active' => true,
        ]);
    }

    private function submitVisa(): \Illuminate\Testing\TestResponse
    {
        return $this->post('/api/visa-applications', [
            'visa_id' => $this->visa()->id,
            'first_name' => 'Amina',
            'last_name' => 'Trabelsi',
            'email' => 'amina@example.com',
            'phone' => '+21622000000',
            'passport_number' => 'X1234567',
            'birth_date' => '1990-05-01',
            'travel_date' => now()->addMonth()->toDateString(),
            'visa_type' => 'tourist',
            'passport_copy' => UploadedFile::fake()->createWithContent('passport.pdf', self::SCAN),
        ], ['Accept' => 'application/json']);
    }

    public function test_visa_passport_number_and_scan_are_encrypted_at_rest(): void
    {
        $this->submitVisa()->assertCreated();

        $raw = DB::table('visa_applications')->first();
        $this->assertStringStartsWith(PassportVault::PREFIX, $raw->passport_number);
        $this->assertStringNotContainsString('X1234567', $raw->passport_number);

        $stored = Storage::disk('local')->get($raw->passport_copy_path);
        $this->assertStringEndsWith('.bin', $raw->passport_copy_path);
        $this->assertStringNotContainsString('X1234567', $stored);
        $this->assertStringNotContainsString('%PDF', $stored);

        $application = VisaApplication::query()->first();
        $this->assertSame('X1234567', $application->passport_number);
        $this->assertSame(self::SCAN, app(PassportVault::class)->readFile($application->passport_copy_path));
    }

    public function test_commercial_email_attaches_the_decrypted_scan(): void
    {
        $this->submitVisa()->assertCreated();
        $application = VisaApplication::query()->first();

        $mail = (new VisaApplicationNotification($application))->toMail(new AnonymousNotifiable);

        $this->assertCount(1, $mail->rawAttachments);
        $this->assertSame(self::SCAN, $mail->rawAttachments[0]['data']);
        $this->assertSame('passport-amina-trabelsi.pdf', $mail->rawAttachments[0]['name']);
    }

    public function test_nothing_is_stored_when_the_key_is_missing(): void
    {
        Config::set('passport.key', null);
        $this->app->forgetInstance(PassportVault::class);

        $this->submitVisa()->assertStatus(503);

        $this->assertSame(0, VisaApplication::query()->count());
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_traveller_passports_in_bookings_are_encrypted(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Car::factory()->create(['slug' => 'clio-5']);

        $response = $this->actingAs($client)->postJson('/api/bookings', [
            'type' => 'car',
            'item_slug' => 'clio-5',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(12)->toDateString(),
            'client' => ['name' => 'Sami', 'email' => 'sami@example.com'],
            'amount' => 100,
            'guests' => [['name' => 'Sami Ben Ali', 'passport_number' => 'P7654321', 'passport_expiry' => '2031-01-01']],
        ])->assertCreated();

        $raw = (string) DB::table('bookings')->value('guests');
        $this->assertStringNotContainsString('P7654321', $raw);
        $this->assertStringNotContainsString('2031-01-01', $raw);
        $this->assertStringContainsString('Sami Ben Ali', $raw);

        $response->assertJsonPath('guests.0.passport_number', 'P7654321');
        $this->assertSame('2031-01-01', Booking::query()->first()->guests[0]['passport_expiry']);
    }

    public function test_admin_can_view_the_passport_and_others_cannot(): void
    {
        $this->submitVisa()->assertCreated();
        $id = VisaApplication::query()->value('id');
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $client = User::factory()->create(['role' => 'client', 'active' => true]);

        $list = $this->actingAs($admin)->getJson('/api/admin/visa-applications')->assertOk();
        $this->assertSame('••••4567', $list->json('data.0.passport_number'));

        $this->actingAs($admin)->getJson("/api/admin/visa-applications/{$id}")
            ->assertOk()->assertJsonPath('data.passport_number', 'X1234567');

        $scan = $this->actingAs($admin)->get("/api/admin/visa-applications/{$id}/passport")->assertOk();
        $this->assertSame(self::SCAN, $scan->getContent());
        $this->assertStringContainsString('no-store', $scan->headers->get('Cache-Control'));

        $this->actingAs($client)->getJson("/api/admin/visa-applications/{$id}/passport")->assertForbidden();
    }

    public function test_guests_cannot_reach_the_passport(): void
    {
        $this->submitVisa()->assertCreated();
        $id = VisaApplication::query()->value('id');

        $this->getJson("/api/admin/visa-applications/{$id}/passport")->assertUnauthorized();
    }

    public function test_backfill_encrypts_legacy_data_once(): void
    {
        $visa = $this->visa();
        Storage::disk('public')->put('uploads/visa_passports/old.pdf', self::SCAN);
        $id = DB::table('visa_applications')->insertGetId([
            'visa_id' => $visa->id, 'first_name' => 'Old', 'last_name' => 'Row', 'email' => 'o@example.com',
            'phone' => '1', 'passport_number' => 'L0000001', 'birth_date' => '1980-01-01',
            'travel_date' => '2026-12-01', 'visa_type' => 'tourist', 'previous_visa' => false,
            'passport_copy_path' => 'uploads/visa_passports/old.pdf', 'status' => 'pending',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $user = User::factory()->create();
        DB::table('bookings')->insert([
            'id' => (string) str()->uuid(), 'user_id' => $user->id, 'type' => 'car', 'status' => 'Pending',
            'client' => '{}', 'total_amount' => 1, 'booking_ref' => 1,
            'guests' => json_encode([['name' => 'A', 'passport_number' => 'G1111111']]),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->artisan('passports:encrypt-existing')->assertSuccessful();

        $row = DB::table('visa_applications')->find($id);
        $this->assertTrue(PassportVault::isEncrypted($row->passport_number));
        $this->assertFalse(Storage::disk('public')->exists('uploads/visa_passports/old.pdf'), 'plain scan deleted');
        $this->assertSame(self::SCAN, app(PassportVault::class)->readFile($row->passport_copy_path));
        $this->assertSame('application/pdf', $row->passport_copy_mime);
        $this->assertStringNotContainsString('G1111111', (string) DB::table('bookings')->value('guests'));
        $this->assertSame('L0000001', VisaApplication::query()->find($id)->passport_number);

        // Second run changes nothing.
        $before = DB::table('visa_applications')->find($id);
        $this->artisan('passports:encrypt-existing')
            ->expectsOutputToContain('Passport numbers: 0, scans: 0, bookings with traveller passports: 0')
            ->assertSuccessful();
        $this->assertEquals($before, DB::table('visa_applications')->find($id));
    }
}
