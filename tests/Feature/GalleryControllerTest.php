<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\GalleryImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $user = \App\Models\User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
    }

    public function test_image_is_deleted_when_gallery_record_is_deleted()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg');
        $path = $file->store('gallery', 'public');
        
        $gallery = GalleryImage::create([
            'url' => '/storage/' . $path,
            'title' => ['en' => 'Test'],
            'category' => 'Test',
        ]);

        $this->assertTrue(Storage::disk('public')->exists($path));

        $this->deleteJson('/api/admin/gallery/' . $gallery->id)
            ->assertStatus(200);

        $this->assertFalse(Storage::disk('public')->exists($path));
    }

    public function test_old_image_is_deleted_when_new_image_is_uploaded()
    {
        Storage::fake('public');

        $oldFile = UploadedFile::fake()->create('old.jpg', 100, 'image/jpeg');
        $oldPath = $oldFile->store('gallery', 'public');
        
        $gallery = GalleryImage::create([
            'url' => '/storage/' . $oldPath,
            'title' => ['en' => 'Old'],
            'category' => 'Old',
        ]);

        $this->assertTrue(Storage::disk('public')->exists($oldPath));

        $newFile = UploadedFile::fake()->create('new.jpg', 100, 'image/jpeg');

        $this->putJson('/api/admin/gallery/' . $gallery->id, [
            'image' => $newFile,
            'title' => ['en' => 'New'],
            'category' => 'New',
        ])->assertStatus(200);

        $this->assertFalse(Storage::disk('public')->exists($oldPath));
        $this->assertTrue(Storage::disk('public')->exists('gallery/' . $newFile->hashName()));
    }
}
