<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_main_and_gallery_images_and_files_are_stored(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        // Helper to create a valid PNG upload without requiring GD extension
        $makePngUpload = function (string $filename): UploadedFile {
            $data = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=');
            $path = sys_get_temp_dir().'/'.uniqid('testimg_').'_'.$filename;
            file_put_contents($path, $data);

            return new UploadedFile($path, $filename, 'image/png', null, true);
        };

        $payload = [
            'name' => 'E2E Test City',
            'country' => 'Testland',
            'category' => 'City',
            'price' => 100,
            'rating' => 4.5,
            // main image file
            'image' => $makePngUpload('main.png'),
            // gallery files
            'gallery_files' => [
                $makePngUpload('g1.png'),
                $makePngUpload('g2.png'),
            ],
            'description' => 'E2E description',
            'description_en' => 'E2E description',
        ];

        $response = $this->actingAs($admin)
            ->post('/api/admin/destinations', $payload);

        $response->assertStatus(201);

        $destination = Destination::query()->latest('id')->firstOrFail();

        // Image path should be stored and point to storage
        $this->assertStringStartsWith('/storage/uploads/destinations/', $destination->image);

        // Verify the file exists on the public disk
        $imagePath = ltrim($destination->image, '/storage/');
        $this->assertTrue(Storage::disk('public')->exists($imagePath));

        // Gallery should be an array in details and contain stored paths
        $this->assertIsArray($destination->details['gallery']);
        $this->assertCount(2, $destination->details['gallery']);

        foreach ($destination->details['gallery'] as $g) {
            $this->assertStringStartsWith('/storage/uploads/destinations/', $g);
            $gPath = ltrim($g, '/storage/');
            $this->assertTrue(Storage::disk('public')->exists($gPath));
        }
    }

    public function test_admin_can_update_destination_images_via_method_spoofing(): void
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

        $this->actingAs($admin)
            ->post('/api/admin/destinations', [
                'name' => 'E2E Test City',
                'country' => 'Testland',
                'category' => 'City',
                'price' => 100,
                'rating' => 4.5,
                'image' => $makePngUpload('main-original.png'),
                'gallery_files' => [$makePngUpload('gallery-original.png')],
                'description' => 'Original description',
                'description_en' => 'Original description',
            ])
            ->assertCreated();

        $destination = Destination::query()->latest('id')->firstOrFail();
        $originalImage = $destination->image;

        $this->actingAs($admin)
            ->post('/api/admin/destinations/'.$destination->getKey(), [
                '_method' => 'PUT',
                'name' => 'E2E Test City',
                'country' => 'Testland',
                'category' => 'City',
                'price' => 150,
                'rating' => 4.8,
                'image' => $makePngUpload('main-updated.png'),
                'gallery_files' => [
                    $makePngUpload('gallery-updated-1.png'),
                    $makePngUpload('gallery-updated-2.png'),
                ],
                'description' => 'Updated description',
                'description_en' => 'Updated description',
                'about_en' => 'Updated about text.',
                'highlights' => "New skyline\nNew beaches",
                'bestTime_en' => 'May to September',
                'language_en' => 'English',
                'currency_en' => 'TND',
                'weather_en' => 'Sunny',
            ])
            ->assertOk();

        $updated = Destination::query()->findOrFail($destination->getKey());

        $this->assertNotSame($originalImage, $updated->image);
        $this->assertStringStartsWith('/storage/uploads/destinations/', $updated->image);
        $this->assertTrue(Storage::disk('public')->exists(ltrim($updated->image, '/storage/')));

        $this->assertIsArray($updated->details['gallery']);
        $this->assertCount(2, $updated->details['gallery']);

        foreach ($updated->details['gallery'] as $g) {
            $this->assertStringStartsWith('/storage/uploads/destinations/', $g);
        }

        $this->actingAs($admin)
            ->getJson('/api/destinations/'.$updated->slug)
            ->assertOk()
            ->assertJsonPath('price', 150)
            ->assertJsonPath('rating', 4.8)
            ->assertJsonPath('about.en', 'Updated about text.')
            ->assertJsonPath('bestTime.en', 'May to September')
            ->assertJsonPath('language.en', 'English')
            ->assertJsonPath('currency.en', 'TND')
            ->assertJsonPath('weather.en', 'Sunny');
    }

    public function test_admin_can_update_destination_main_image_without_resubmitting_other_fields(): void
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

        $this->actingAs($admin)
            ->post('/api/admin/destinations', [
                'name' => 'E2E Test City',
                'country' => 'Testland',
                'category' => 'City',
                'price' => 100,
                'rating' => 4.5,
                'image' => $makePngUpload('main-original.png'),
                'gallery_files' => [$makePngUpload('gallery-original.png')],
                'description' => 'Original description',
                'description_en' => 'Original description',
            ])
            ->assertCreated();

        $destination = Destination::query()->latest('id')->firstOrFail();
        $originalGallery = $destination->details['gallery'];

        $this->actingAs($admin)
            ->post('/api/admin/destinations/'.$destination->getKey(), [
                '_method' => 'PUT',
                'image' => $makePngUpload('main-replacement.png'),
            ])
            ->assertOk();

        $updated = Destination::query()->findOrFail($destination->getKey());

        $this->assertNotSame($destination->image, $updated->image);
        $this->assertSame($destination->country, $updated->country);
        $this->assertSame($destination->name, $updated->name);
        $this->assertSame($destination->price, $updated->price);
        $this->assertSame($destination->rating, $updated->rating);
        $this->assertSame($originalGallery, $updated->details['gallery']);
        $this->assertTrue(Storage::disk('public')->exists(ltrim($updated->image, '/storage/')));
    }

    public function test_admin_can_upload_and_replace_hotel_images(): void
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
            'name_en' => 'Luxury Palace Hotel',
            'name_fr' => 'Hôtel Palais de Luxe',
            'name_ar' => 'فندق قصر الفخامة',
            'location_en' => 'Downtown',
            'location_fr' => 'Centre-ville',
            'location_ar' => 'وسط المدينة',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxe',
            'category_ar' => 'فاخرة',
            'city_en' => 'Lisbon',
            'city_fr' => 'Lisbonne',
            'city_ar' => 'لشبونة',
            'country_en' => 'Portugal',
            'country_fr' => 'Portugal',
            'country_ar' => 'البرتغال',
            'address' => 'Rua Augusta 100',
            'phone' => '+351-213-000-000',
            'whatsapp' => '+351-213-000-001',
            'description_en' => 'A luxurious palace hotel in the heart of Lisbon.',
            'description_fr' => 'Un palace hôtel luxueux au cœur de Lisbonne.',
            'description_ar' => 'فندق قصر فاخر في قلب لشبونة.',
            'price' => 450,
            'rating' => 4.8,
            'stars' => 5,
            'reviews' => 342,
            'destination_slug' => 'lisbon',
            'image' => $makePngUpload('hotel-main-original.png'),
            'gallery' => "/storage/uploads/hotels/hotel-gallery-1.png\n/storage/uploads/hotels/hotel-gallery-2.png",
            'amenities' => [
                ['id' => null, 'name' => ['en' => 'Swimming Pool', 'fr' => 'Piscine', 'ar' => 'حمام السباحة']],
                ['id' => null, 'name' => ['en' => 'Spa', 'fr' => 'Spa', 'ar' => 'منتجع صحي']],
            ],
            'rooms' => [
                [
                    'id' => null,
                    'name' => ['en' => 'Deluxe Suite', 'fr' => 'Suite Deluxe', 'ar' => 'جناح ديلوكس'],
                    'description' => ['en' => 'Spacious suite with city views', 'fr' => 'Suite spacieuse avec vue sur la ville', 'ar' => 'جناح واسع مع إطلالة على المدينة'],
                    'pricePerNight' => 500,
                    'capacity' => 2,
                    'size' => 45.0,
                    'features' => [
                        ['id' => null, 'name' => ['en' => 'King Bed', 'fr' => 'Lit King Size', 'ar' => 'سرير كينج']],
                    ],
                    'images' => ['/images/rooms/deluxe-1.jpg'],
                ],
            ],
        ];

        $this->actingAs($admin)
            ->post('/api/admin/hotels', $payload)
            ->assertCreated();

        /** @var Hotel $hotel */
        $hotel = Hotel::query()->latest('id')->firstOrFail();

        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
        $this->assertTrue(Storage::disk('public')->exists(ltrim($hotel->image, '/storage/')));
        $this->assertIsArray($hotel->details['gallery']);
        $this->assertCount(2, $hotel->details['gallery']);

        foreach ($hotel->details['gallery'] as $g) {
            $this->assertStringStartsWith('/storage/uploads/hotels/', $g);
        }

        $this->actingAs($admin)
            ->getJson('/api/hotels/'.$hotel->slug)
            ->assertOk()
            ->assertJsonPath('image', $hotel->image)
            ->assertJsonPath('category.en', 'Luxury')
            ->assertJsonPath('gallery.0', $hotel->details['gallery'][0]);

        $this->actingAs($admin)
            ->post('/api/admin/hotels/'.$hotel->getKey(), [
                '_method' => 'PUT',
                'name_en' => 'Luxury Palace Hotel',
                'name_fr' => 'Hôtel Palais de Luxe',
                'name_ar' => 'فندق قصر الفخامة',
                'location_en' => 'Downtown',
                'location_fr' => 'Centre-ville',
                'location_ar' => 'وسط المدينة',
                'category_en' => 'Luxury',
                'category_fr' => 'Luxe',
                'category_ar' => 'فاخرة',
                'city_en' => 'Lisbon',
                'city_fr' => 'Lisbonne',
                'city_ar' => 'لشبونة',
                'country_en' => 'Portugal',
                'country_fr' => 'Portugal',
                'country_ar' => 'البرتغال',
                'address' => 'Rua Augusta 100',
                'phone' => '+351-213-000-000',
                'whatsapp' => '+351-213-000-001',
                'description_en' => 'Updated description',
                'description_fr' => 'Description mise à jour',
                'description_ar' => 'وصف محدث',
                'price' => 500,
                'rating' => 4.9,
                'stars' => 5,
                'reviews' => 360,
                'destination_slug' => 'lisbon',
                'image' => $makePngUpload('hotel-main-updated.png'),
                'gallery' => "/storage/uploads/hotels/hotel-gallery-1.png\n/storage/uploads/hotels/hotel-gallery-2.png",
                'amenities' => [
                    ['id' => null, 'name' => ['en' => 'Gym', 'fr' => 'Gym', 'ar' => 'صالة الألعاب']],
                ],
            ])
            ->assertOk();

        $updated = Hotel::query()->findOrFail($hotel->getKey());

        $this->assertNotSame($hotel->image, $updated->image);
        $this->assertTrue(Storage::disk('public')->exists(ltrim($updated->image, '/storage/')));
        $this->assertEquals(500, $updated->price);
        $this->assertEquals('Gym', $updated->amenities[0]['name']['en']);
        $this->assertEquals('Luxury', $updated->details['category']['en']);
        $this->assertCount(2, $updated->details['gallery']);

        $this->actingAs($admin)
            ->getJson('/api/hotels/'.$updated->slug)
            ->assertOk()
            ->assertJsonPath('price', 500)
            ->assertJsonPath('rating', 4.9)
            ->assertJsonPath('gallery.1', $updated->details['gallery'][1]);
    }
}
