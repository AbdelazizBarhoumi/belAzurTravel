<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_event_with_gallery_and_schedule(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $makePngUpload = function (string $filename): UploadedFile {
            $data = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=');
            $path = sys_get_temp_dir().'/'.uniqid('testimg_').'_'.$filename;
            file_put_contents($path, $data);

            return new UploadedFile($path, $filename, 'image/png', null, true);
        };

        $payload = [
            'category_key' => 'cultural',
            'title_en' => 'Sample Event',
            'title_fr' => 'Événement Exemple',
            'title_ar' => 'حدث تجريبي',
            'location_en' => 'Test City',
            'location_fr' => 'Ville Test',
            'location_ar' => 'مدينة اختبار',
            'date_en' => 'June 2026',
            'date_fr' => 'Juin 2026',
            'date_ar' => 'يونيو 2026',
            'price' => 199,
            'description_en' => 'Event description',
            'image' => $makePngUpload('main.png'),
            'gallery_files' => [
                $makePngUpload('g1.png'),
                $makePngUpload('g2.png'),
            ],
            'schedule' => json_encode([
                ['day' => ['en' => 'Day 1'], 'activity' => ['en' => 'Arrival'], 'details' => ['en' => 'Welcome']],
            ]),
        ];

        $response = $this->actingAs($admin)
            ->withoutMiddleware()
            ->post('/api/admin/events', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.category_key', 'cultural');

        $event = Event::query()->latest('id')->firstOrFail();

        $this->assertSame('cultural', $event->category_key);

        // Image path should be stored under /storage/uploads/events/
        $this->assertStringStartsWith('/storage/uploads/events/', $event->image);
        $this->assertTrue(Storage::disk('public')->exists(ltrim($event->image, '/storage/')));

        // Gallery should exist and point to storage paths
        $this->assertIsArray($event->details['gallery']);
        $this->assertCount(2, $event->details['gallery']);
        foreach ($event->details['gallery'] as $g) {
            $this->assertStringStartsWith('/storage/uploads/events/', $g);
            $this->assertTrue(Storage::disk('public')->exists(ltrim($g, '/storage/')));
        }

        // Schedule should be stored as array
        $this->assertIsArray($event->details['schedule']);
        $this->assertCount(1, $event->details['schedule']);
        $this->assertEquals('Day 1', $event->details['schedule'][0]['day']['en']);

        // Public retrieval includes details merged from `details`
        $this->actingAs($admin)
            ->getJson('/api/events/'.$event->slug)
            ->assertOk()
            ->assertJsonPath('schedule.0.day.en', 'Day 1');
    }

    public function test_admin_persists_localized_event_fields_for_all_languages(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'category_key' => 'festival',
            'title_en' => 'Title EN',
            'title_fr' => 'Titre FR',
            'title_ar' => 'عنوان AR',
            'location_en' => 'Location EN',
            'location_fr' => 'Lieu FR',
            'location_ar' => 'موقع AR',
            'date_en' => 'Date EN',
            'date_fr' => 'Date FR',
            'date_ar' => 'تاريخ AR',
            'description_en' => 'Description EN',
            'description_fr' => 'Description FR',
            'description_ar' => 'وصف AR',
            'about_en' => 'About EN',
            'about_fr' => 'À propos FR',
            'about_ar' => 'حول AR',
            'attendees_en' => '120 people',
            'attendees_fr' => '120 personnes',
            'attendees_ar' => '120 شخص',
            'price' => 555,
            'image' => '/images/events/sample.jpg',
        ];

        $response = $this->actingAs($admin)
            ->withoutMiddleware()
            ->postJson('/api/admin/events', $payload)
            ->assertCreated();

        /** @var Event $event */
        $event = Event::query()->findOrFail($response->json('data.id'));

        $this->assertSame('festival', $event->category_key);

        $this->assertSame('Title EN', $event->title['en']);
        $this->assertSame('Titre FR', $event->title['fr']);
        $this->assertSame('عنوان AR', $event->title['ar']);

        $this->assertSame('Location EN', $event->location['en']);
        $this->assertSame('Lieu FR', $event->location['fr']);
        $this->assertSame('موقع AR', $event->location['ar']);

        $this->assertSame('Description EN', $event->description['en']);
        $this->assertSame('Description FR', $event->description['fr']);
        $this->assertSame('وصف AR', $event->description['ar']);

        $this->assertSame('About EN', $event->details['about']['en']);
        $this->assertSame('À propos FR', $event->details['about']['fr']);
        $this->assertSame('حول AR', $event->details['about']['ar']);

        $this->assertSame('120 people', $event->details['attendees']['en']);
        $this->assertSame('120 personnes', $event->details['attendees']['fr']);
        $this->assertSame('120 شخص', $event->details['attendees']['ar']);

        $this->actingAs($admin)
            ->getJson('/api/events/'.$event->slug)
            ->assertOk()
            ->assertJsonPath('category_key', 'festival')
            ->assertJsonPath('about.fr', 'À propos FR')
            ->assertJsonPath('attendees.ar', '120 شخص');
    }

    public function test_public_event_cache_refreshes_after_admin_update(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $event = Event::factory()->create([
            'title' => ['en' => 'Cached Event', 'fr' => 'Événement en cache', 'ar' => 'حدث مخزن'],
            'location' => ['en' => 'Paris', 'fr' => 'Paris', 'ar' => 'باريس'],
            'date' => ['en' => 'May 2026', 'fr' => 'Mai 2026', 'ar' => 'مايو 2026'],
            'description' => ['en' => 'Old description', 'fr' => 'Ancienne description', 'ar' => 'وصف قديم'],
            'price' => 250,
            'image' => '/images/events/cached.jpg',
        ]);

        $this->getJson('/api/events/'.$event->slug)
            ->assertOk()
            ->assertJsonPath('description.en', 'Old description');

        $this->actingAs($admin)
            ->withoutMiddleware()
            ->putJson('/api/admin/events/'.$event->id, [
                'title_en' => 'Cached Event',
                'title_fr' => 'Événement en cache',
                'title_ar' => 'حدث مخزن',
                'location_en' => 'Paris',
                'location_fr' => 'Paris',
                'location_ar' => 'باريس',
                'date_en' => 'May 2026',
                'date_fr' => 'Mai 2026',
                'date_ar' => 'مايو 2026',
                'price' => 250,
                'description_en' => 'Updated description',
                'description_fr' => 'Description mise à jour',
                'description_ar' => 'وصف محدث',
            ])
            ->assertOk();

        $this->getJson('/api/events/'.$event->slug)
            ->assertOk()
            ->assertJsonPath('description.en', 'Updated description');
    }
}
