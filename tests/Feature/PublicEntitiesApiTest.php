<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\Tour;
use App\Models\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEntitiesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_entity_detail_endpoints_return_json_when_page_is_enabled(): void
    {
        $this->seedEntityVisibility();
        $this->seedEntityItems();

        $this->getJson('/api/tours/greek-island-hopping')
            ->assertOk()
            ->assertJsonPath('slug', 'greek-island-hopping')
            ->assertJsonPath('pricePerPerson', 2499);

        $this->getJson('/api/destinations/santorini')
            ->assertOk()
            ->assertJsonPath('slug', 'santorini')
            ->assertJsonPath('categoryKey', 'beach');
    }

    private function seedEntityVisibility(): void
    {
        SiteSetting::query()->create([
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 555 123 4567',
            'content' => [
                'nav' => [
                    'settings' => [
                        'header' => [
                            [
                                'pageKey' => 'destinations',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'tours',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                        ],
                        'footer' => [],
                    ],
                ],
            ],
        ]);
    }

    private function seedEntityItems(): void
    {
        Destination::query()->create([
            'slug' => 'santorini',
            'name' => ['fr' => 'Santorin', 'ar' => 'سانتوريني', 'en' => 'Santorini'],
            'country' => ['fr' => 'Grèce', 'ar' => 'اليونان', 'en' => 'Greece'],
            'category_key' => 'beach',
            'category' => ['fr' => 'Plage', 'ar' => 'شاطئ', 'en' => 'Beach'],
            'price' => 1299,
            'rating' => 4.9,
            'image' => '/images/destination-paris.jpg',
            'description' => ['fr' => 'Ionian escape', 'ar' => 'Ionian escape', 'en' => 'Ionian escape'],
            'details' => [
                'gallery' => ['/images/destination-paris.jpg'],
                'about' => ['fr' => 'About', 'ar' => 'About', 'en' => 'About'],
                'highlights' => ['One', 'Two'],
                'bestTime' => ['fr' => 'Spring', 'ar' => 'Spring', 'en' => 'Spring'],
                'language' => ['fr' => 'Greek', 'ar' => 'Greek', 'en' => 'Greek'],
                'currency' => ['fr' => 'Euro', 'ar' => 'Euro', 'en' => 'Euro'],
                'weather' => ['fr' => 'Mild', 'ar' => 'Mild', 'en' => 'Mild'],
            ],
        ]);

        Tour::query()->create([
            'slug' => 'greek-island-hopping',
            'name' => ['fr' => 'Îles Grecques en Liberté', 'ar' => 'جولة الجزر اليونانية', 'en' => 'Greek Island Hopping'],
            'location' => ['fr' => 'Greece', 'ar' => 'Greece', 'en' => 'Greece'],
            'duration' => ['fr' => '7 Days', 'ar' => '7 Days', 'en' => '7 Days'],
            'duration_days' => 7,
            'duration_nights' => 6,
            'max_group' => 12,
            'price' => 2499,
            'rating' => 4.9,
            'image' => '/images/hero-travel.jpg',
            'description' => ['fr' => 'Cycladic islands', 'ar' => 'Cycladic islands', 'en' => 'Cycladic islands'],
            'details' => [
                'type' => ['fr' => 'Tour', 'ar' => 'Tour', 'en' => 'Tour'],
                'images' => ['/images/hero-travel.jpg'],
                'tags' => ['culture', 'guided'],
                'itinerary' => [
                    [
                        'day' => 1,
                        'title' => ['fr' => 'Arrival and welcome', 'ar' => 'Arrival and welcome', 'en' => 'Arrival and welcome'],
                        'details' => ['fr' => 'Meet your host and settle in.', 'ar' => 'Meet your host and settle in.', 'en' => 'Meet your host and settle in.'],
                    ],
                ],
                'inclusions' => [
                    ['fr' => 'Breakfast', 'ar' => 'Breakfast', 'en' => 'Breakfast'],
                    ['fr' => 'Local guide', 'ar' => 'Local guide', 'en' => 'Local guide'],
                ],
                'excludes' => [
                    ['fr' => 'International flights', 'ar' => 'International flights', 'en' => 'International flights'],
                    ['fr' => 'Travel insurance', 'ar' => 'Travel insurance', 'en' => 'Travel insurance'],
                ],
            ],
        ]);
    }
}

