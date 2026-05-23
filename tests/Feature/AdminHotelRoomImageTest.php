<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminHotelRoomImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_room_images_for_hotel(): void
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
            'name_en' => 'Test Hotel',
            'name_fr' => 'Hôtel de Test',
            'name_ar' => 'فندق اختبار',
            'location_en' => 'Test Location',
            'location_fr' => 'Emplacement de Test',
            'location_ar' => 'موقع الاختبار',
            'category_en' => 'Test Category',
            'category_fr' => 'Catégorie de Test',
            'category_ar' => 'فئة الاختبار',
            'rooms' => [
                [
                    'name' => ['en' => 'Deluxe Suite'],
                ],
            ],
            'image' => $makePngUpload('main.png'),
        ];

        // Simulate file upload for room
        $payload['rooms'][0]['images'] = [$makePngUpload('room.png')];

        $response = $this->actingAs($admin)
            ->post('/api/admin/hotels', $payload);

        $response->assertCreated();

        $hotel = Hotel::query()->latest('id')->firstOrFail();
        $room = $hotel->rooms()->with('imageItems')->firstOrFail();

        $this->assertCount(1, $hotel->rooms);
        $this->assertCount(1, $response->json('data.rooms'));
        $roomImages = $response->json('data.rooms.0.images');
        $this->assertIsArray($roomImages);
        $this->assertGreaterThanOrEqual(1, count($roomImages));
        $lastImage = end($roomImages);
        $this->assertStringStartsWith('/storage/uploads/hotels/rooms/', $lastImage);

        $imagePath = ltrim($lastImage, '/storage/');
        $this->assertTrue(Storage::disk('public')->exists($imagePath));
        $this->assertCount(1, $room->imageItems);
    }

    public function test_admin_can_create_hotel_with_main_image_and_one_room_without_ghost_rooms(): void
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

        $response = $this->actingAs($admin)->post('/api/admin/hotels', [
            'name_en' => 'Multipart Hotel',
            'name_fr' => 'Hôtel Multipart',
            'name_ar' => 'فندق متعدد',
            'location_en' => 'City Center',
            'location_fr' => 'Centre-ville',
            'location_ar' => 'وسط المدينة',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxe',
            'category_ar' => 'فاخر',
            'city_en' => 'Tunis',
            'city_fr' => 'Tunis',
            'city_ar' => 'تونس',
            'country_en' => 'Tunisia',
            'country_fr' => 'Tunisie',
            'country_ar' => 'تونس',
            'description_en' => 'Hotel with one room',
            'description_fr' => 'Hotel with one room',
            'description_ar' => 'Hotel with one room',
            'price' => 260,
            'destination_slug' => 'tunis',
            'address' => 'Rue de la Paix',
            'phone' => '+216-100-200',
            'whatsapp' => '+216-100-201',
            'image' => $makePngUpload('hotel-main.png'),
            'rooms' => [
                [
                    'id' => 'item-room-1',
                    'name' => ['en' => 'Deluxe Suite', 'fr' => 'Suite Deluxe', 'ar' => 'جناح فاخر'],
                    'description' => ['en' => 'Sea view suite', 'fr' => 'Suite vue mer', 'ar' => 'جناح مطل على البحر'],
                    'pricePerNight' => 180,
                    'capacity' => 2,
                    'size' => 35,
                    'features' => ['Balcony', 'WiFi'],
                    'images' => [$makePngUpload('room-main.png')],
                ],
            ],
            'amenities' => [],
        ]);

        $response->assertCreated();

        $hotel = Hotel::query()->latest('id')->firstOrFail();
        $this->assertCount(1, $hotel->rooms);

        $room = $hotel->rooms()->with(['featureItems', 'imageItems'])->firstOrFail();
        $this->assertSame('Deluxe Suite', $room->name_en);
        $this->assertCount(2, $room->featureItems);
        $this->assertCount(1, $room->imageItems);
        $this->assertNotNull($room->imageItems->first()?->path);
        $this->assertStringStartsWith('/storage/uploads/hotels/rooms/', $room->imageItems->first()->path);
        $this->assertCount(1, $response->json('data.rooms'));
    }
}
