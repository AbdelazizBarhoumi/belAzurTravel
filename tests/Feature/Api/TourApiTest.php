<?php

namespace Tests\Feature\Api;

use App\Models\GalleryImage;
use App\Models\Tour;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TourApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_tour_api_returns_expected_data(): void
    {
        $galleryImage = GalleryImage::factory()->create([
            'url' => '/storage/uploads/gallery/tour-shared.jpg',
        ]);

        $tour = Tour::factory()->create([
            'itinerary' => [['day' => 1, 'activity' => 'Sightseeing']],
            'images' => [$galleryImage->id, 'img2.jpg'],
            'includes' => ['Breakfast'],
            'excludes' => ['Lunch'],
        ]);

        // Test Index
        $this->getJson('/api/tours')
            ->assertStatus(200)
            ->assertJsonPath('0.slug', $tour->slug);

        // Test Show
        $this->getJson('/api/tours/'.$tour->slug)
            ->assertStatus(200)
            ->assertJsonPath('itinerary', [['day' => 1, 'activity' => 'Sightseeing']])
            ->assertJsonPath('gallery', ['/storage/uploads/gallery/tour-shared.jpg', 'img2.jpg'])
            ->assertJsonPath('images', ['/storage/uploads/gallery/tour-shared.jpg', 'img2.jpg'])
            ->assertJsonPath('inclusions', ['Breakfast'])
            ->assertJsonPath('excludes', ['Lunch']);
    }
}
