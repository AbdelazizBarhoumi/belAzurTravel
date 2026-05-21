<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\GalleryImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryAdminE2ETest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
    }

    public function test_admin_can_create_and_update_gallery_image_with_full_data()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg');

        $payload = [
            'title' => ['fr' => 'Titre FR', 'ar' => 'العنوان AR', 'en' => 'Title EN'],
            'category' => 'Luxury',
            'image' => $file,
        ];

        // Create
        $response = $this->postJson('/api/admin/gallery', $payload);
        $response->assertStatus(200);

        $gallery = GalleryImage::first();
        $this->assertEquals('Luxury', $gallery->category);
        $this->assertEquals('Title EN', $gallery->title['en']);

        // Update
        $updatePayload = [
            'title' => ['fr' => 'Nouveau Titre FR', 'ar' => 'عنوان جديد AR', 'en' => 'New Title EN'],
            'category' => 'Adventure',
        ];

        $response = $this->putJson('/api/admin/gallery/' . $gallery->id, $updatePayload);
        $response->assertStatus(200);

        $gallery->refresh();
        $this->assertEquals('Adventure', $gallery->category);
        $this->assertEquals('New Title EN', $gallery->title['en']);
    }
}
