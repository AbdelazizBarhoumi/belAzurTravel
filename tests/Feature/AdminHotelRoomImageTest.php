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
            ->postJson('/api/admin/hotels', $payload);

        $response->assertCreated();

        $hotel = Hotel::query()->latest('id')->firstOrFail();
        $details = $hotel->details;
        
        $this->assertIsArray($details['rooms'][0]['images']);
        $this->assertGreaterThanOrEqual(1, count($details['rooms'][0]['images']));
        $lastImage = end($details['rooms'][0]['images']);
        $this->assertStringStartsWith('/storage/uploads/hotels/rooms/', $lastImage);
        
        $imagePath = ltrim($lastImage, '/storage/');
        $this->assertTrue(Storage::disk('public')->exists($imagePath));
    }
}
