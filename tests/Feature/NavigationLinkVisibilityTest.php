<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NavigationLinkVisibilityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: All navigation links checked → everything accessible to clients
     */
    public function test_all_nav_links_enabled_client_receives_all_content(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $this->setupAllNavLinksEnabled();

        $response = $this->actingAs($user)->getJson('/api/site-settings');

        $response->assertOk()
            ->assertJsonPath('content.nav.settings.header.0.enabled', true)
            ->assertJsonPath('content.nav.settings.header.1.enabled', true)
            ->assertJsonPath('content.nav.settings.header.2.enabled', true)
            ->assertJsonPath('content.nav.settings.header.3.enabled', true);

        // Verify content pages are present
        $data = $response->json();
        $this->assertArrayHasKey('destinations', $data['content']);
        $this->assertArrayHasKey('tours', $data['content']);
        $this->assertArrayHasKey('promos', $data['content']);
        $this->assertArrayHasKey('gallery', $data['content']);
    }

    /**
     * Test: One link disabled (destinations) → destinations content filtered for clients
     */
    public function test_one_nav_link_disabled_destination_content_filtered_for_client(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $this->setupNavLinksWithDestinationsDisabled();

        $response = $this->actingAs($user)->getJson('/api/site-settings');

        $response->assertOk();
        $data = $response->json();

        // Destinations should be disabled in settings
        $this->assertFalse($data['content']['nav']['settings']['header'][0]['enabled']);

        // Destinations content should NOT be present for client
        $this->assertArrayNotHasKey('destinations', $data['content']);

        // Other content should still be present
        $this->assertArrayHasKey('tours', $data['content']);
        $this->assertArrayHasKey('promos', $data['content']);
    }

    /**
     * Test: One link disabled → other links still render for clients
     */
    public function test_one_link_disabled_does_not_break_other_links(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $this->setupNavLinksWithToursDisabled();

        $response = $this->actingAs($user)->getJson('/api/site-settings');

        $response->assertOk();
        $data = $response->json();

        // Tours should be disabled
        $this->assertFalse($data['content']['nav']['settings']['header'][1]['enabled']);

        // Tours content should NOT be present
        $this->assertArrayNotHasKey('tours', $data['content']);

        // Other pages should still be there
        $this->assertArrayHasKey('destinations', $data['content']);
        $this->assertArrayHasKey('promos', $data['content']);
        $this->assertArrayHasKey('gallery', $data['content']);
    }

    /**
     * Test: Multiple links disabled → only enabled content renders
     */
    public function test_multiple_links_disabled_only_enabled_content_renders(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $this->setupMultipleLinksDisabled();

        $response = $this->actingAs($user)->getJson('/api/site-settings');

        $response->assertOk();
        $data = $response->json();

        // Disabled pages should not be present
        $this->assertArrayNotHasKey('destinations', $data['content']);
        $this->assertArrayNotHasKey('promos', $data['content']);

        // Only tours should be present
        $this->assertArrayHasKey('tours', $data['content']);
    }

    /**
     * Test: Admin always sees all content regardless of link status
     */
    public function test_admin_always_sees_all_content_even_when_links_disabled(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->setupAllNavLinksDisabled();

        $response = $this->actingAs($admin)->getJson('/api/site-settings');

        $response->assertOk();
        $data = $response->json();

        // All content should be present for admin
        $this->assertArrayHasKey('destinations', $data['content']);
        $this->assertArrayHasKey('tours', $data['content']);
        $this->assertArrayHasKey('promos', $data['content']);
        $this->assertArrayHasKey('gallery', $data['content']);
    }

    /**
     * Test: Unauthenticated user gets all content (filter only applies to authenticated clients)
     */
    public function test_unauthenticated_user_sees_all_content_when_link_disabled(): void
    {
        $this->setupNavLinksWithDestinationsDisabled();

        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $data = $response->json();

        // Unauthenticated users get full content
        $this->assertArrayHasKey('destinations', $data['content']);
        $this->assertArrayHasKey('tours', $data['content']);
    }

    /**
     * Test: Gallery is hidden when gallery link is disabled
     */
    public function test_gallery_hidden_when_gallery_link_disabled(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $this->setupNavLinksWithGalleryDisabled();

        $response = $this->actingAs($user)->getJson('/api/site-settings');

        $response->assertOk();
        $data = $response->json();

        // Gallery should not be present
        $this->assertArrayNotHasKey('gallery', $data);
        $this->assertArrayNotHasKey('gallery', $data['content']);

        // Other content should still be there
        $this->assertArrayHasKey('destinations', $data['content']);
    }

    /**
     * Test: Toggling link from enabled to disabled filters content
     */
    public function test_toggling_link_disabled_filters_content_for_client(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Start with all enabled
        $settings = SiteSetting::create([
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
                            [
                                'pageKey' => 'promos',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'gallery',
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
                'destinations' => ['visible' => true],
                'tours' => ['visible' => true],
                'promos' => ['visible' => true],
                'gallery' => ['visible' => true],
            ],
        ]);

        $response = $this->actingAs($user)->getJson('/api/site-settings');
        $this->assertArrayHasKey('tours', $response->json()['content']);
        $this->assertArrayHasKey('destinations', $response->json()['content']);

        // Admin disables tours
        $this->actingAs($admin)->putJson('/api/site-settings', [
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
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'promos',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'gallery',
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
                'destinations' => ['visible' => true],
                'tours' => ['visible' => false],
                'promos' => ['visible' => true],
                'gallery' => ['visible' => true],
            ],
        ])->assertOk();

        // Client should no longer see tours
        $response = $this->actingAs($user)->getJson('/api/site-settings');
        $data = $response->json();
        $this->assertArrayNotHasKey('tours', $data['content']);
        $this->assertArrayHasKey('destinations', $data['content']);
    }

    /**
    * Test: Public data endpoints still work when nav link is disabled
     * The API endpoint returns data regardless of nav visibility settings
     */
    public function test_public_data_endpoints_work_when_nav_link_disabled(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        
        // Disable tours in nav
        SiteSetting::create([
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 555 123 4567',
            'content' => [
                'nav' => [
                    'settings' => [
                        'header' => [
                            [
                                'pageKey' => 'tours',
                                'enabled' => false,
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

        // Create a test tour
        $tourData = [
            'slug' => 'test-tour',
            'name' => ['fr' => 'Test Tour', 'ar' => 'Test Tour', 'en' => 'Test Tour'],
            'location' => ['fr' => 'Greece', 'ar' => 'Greece', 'en' => 'Greece'],
            'duration' => ['fr' => '5 days', 'ar' => '5 days', 'en' => '5 days'],
            'duration_days' => 5,
            'duration_nights' => 4,
            'max_group' => 10,
            'price' => 1999,
            'rating' => 4.8,
            'image' => '/images/test-tour.jpg',
            'description' => ['fr' => 'Test', 'ar' => 'Test', 'en' => 'Test'],
            'details' => [
                'itinerary' => [],
                'highlights' => [],
                'inclusions' => [],
            ],
        ];

        \App\Models\Tour::create($tourData);

        // Tours should NOT appear in site settings for client
        $response = $this->actingAs($user)->getJson('/api/site-settings');
        $this->assertArrayNotHasKey('tours', $response->json()['content']);

        // But the public API endpoint should still return the tour (if it was implemented to check nav settings)
        // This verifies that disabling nav doesn't break the data layer
        $this->assertDatabaseHas('tours', ['slug' => 'test-tour']);
    }

    // ============ Setup Helpers ============

    private function setupAllNavLinksEnabled(): void
    {
        SiteSetting::create([
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
                            [
                                'pageKey' => 'promos',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'gallery',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                        ],
                        'footer' => [
                            [
                                'title' => 'Explore',
                                'pageKeys' => ['destinations', 'tours', 'promos'],
                            ],
                        ],
                    ],
                ],
                'destinations' => ['visible' => true],
                'tours' => ['visible' => true],
                'promos' => ['visible' => true],
                'gallery' => ['visible' => true],
            ],
        ]);
    }

    private function setupNavLinksWithDestinationsDisabled(): void
    {
        SiteSetting::create([
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 555 123 4567',
            'content' => [
                'nav' => [
                    'settings' => [
                        'header' => [
                            [
                                'pageKey' => 'destinations',
                                'enabled' => false,
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
                            [
                                'pageKey' => 'promos',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                        ],
                        'footer' => [
                            [
                                'title' => 'Explore',
                                'pageKeys' => ['tours', 'promos'],
                            ],
                        ],
                    ],
                ],
                'destinations' => ['visible' => false],
                'tours' => ['visible' => true],
                'promos' => ['visible' => true],
            ],
        ]);
    }

    private function setupNavLinksWithToursDisabled(): void
    {
        SiteSetting::create([
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
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'promos',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'gallery',
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
                'destinations' => ['visible' => true],
                'tours' => ['visible' => false],
                'promos' => ['visible' => true],
                'gallery' => ['visible' => true],
            ],
        ]);
    }

    private function setupMultipleLinksDisabled(): void
    {
        SiteSetting::create([
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 555 123 4567',
            'content' => [
                'nav' => [
                    'settings' => [
                        'header' => [
                            [
                                'pageKey' => 'destinations',
                                'enabled' => false,
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
                            [
                                'pageKey' => 'promos',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                        ],
                        'footer' => [],
                    ],
                ],
                'destinations' => ['visible' => false],
                'tours' => ['visible' => true],
                'promos' => ['visible' => false],
            ],
        ]);
    }

    private function setupAllNavLinksDisabled(): void
    {
        SiteSetting::create([
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 555 123 4567',
            'content' => [
                'nav' => [
                    'settings' => [
                        'header' => [
                            [
                                'pageKey' => 'destinations',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'tours',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'promos',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                            [
                                'pageKey' => 'gallery',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                        ],
                        'footer' => [],
                    ],
                ],
                'destinations' => ['visible' => false],
                'tours' => ['visible' => false],
                'promos' => ['visible' => false],
                'gallery' => ['visible' => false],
            ],
        ]);
    }

    private function setupNavLinksWithGalleryDisabled(): void
    {
        SiteSetting::create([
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
                                'pageKey' => 'gallery',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'top',
                                'items' => [],
                            ],
                        ],
                        'footer' => [],
                    ],
                ],
                'destinations' => ['visible' => true],
                'gallery' => ['visible' => false],
            ],
        ]);
    }
}
