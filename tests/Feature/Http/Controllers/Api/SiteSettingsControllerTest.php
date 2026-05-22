<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SiteSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test retrieving site settings
     */
    public function test_can_retrieve_site_settings(): void
    {
        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $response->assertJsonStructure([
            'companyName',
            'email',
            'phone',
            'whatsapp',
            'address',
            'plusCode',
            'year',
            'socialLinks',
            'legalSections',
            'footerLinks',
            'hours',
            'content',
        ]);
    }

    /**
     * Test site settings includes navigation
     */
    public function test_site_settings_includes_navigation(): void
    {
        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $this->assertIsArray($response->json('content.nav.simpleLinks'));
        $this->assertGreaterThan(0, count($response->json('content.nav.simpleLinks')));
    }

    /**
     * Test navigation contains expected items
     */
    public function test_navigation_contains_expected_items(): void
    {
        $response = $this->getJson('/api/site-settings');

        $navLinks = $response->json('content.nav.simpleLinks');
        $navTypes = collect($navLinks)->pluck('type')->unique()->toArray();

        $this->assertContains('simple', $navTypes);
        $this->assertContains('dropdown', $navTypes);
    }

    /**
     * Test updating site settings
     */
    public function test_authenticated_user_can_update_site_settings(): void
    {
        $user = $this->createAuthenticatedAdmin();

        $updateData = [
            'companyName' => 'Updated Company',
            'email' => 'updated@example.com',
            'phone' => '+1 (555) 987-6543',
            'whatsapp' => '15559876543',
            'address' => '456 New St, CA 90001',
            'plusCode' => '8FVC9G8F+5V',
            'year' => 2026,
        ];

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', $updateData);

        $response->assertOk();
        $this->assertDatabaseHas('site_settings', [
            'company_name' => 'Updated Company',
            'email' => 'updated@example.com',
            'plus_code' => '8FVC9G8F+5V',
        ]);
    }

    /**
     * Test plus code is returned and can be updated independently
     */
    public function test_authenticated_user_can_update_plus_code(): void
    {
        $user = $this->createAuthenticatedAdmin();

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', [
                'companyName' => 'BelAzurTravel',
                'email' => 'hello@example.com',
                'phone' => '+1 (555) 123-4567',
                'plusCode' => '8FVC9G8F+5V',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('site_settings', [
            'plus_code' => '8FVC9G8F+5V',
        ]);

        $this->getJson('/api/site-settings')
            ->assertOk()
            ->assertJsonPath('plusCode', '8FVC9G8F+5V');
    }

    /**
     * Test updating navigation via site settings
     */
    public function test_authenticated_user_can_update_navigation(): void
    {
        $user = $this->createAuthenticatedAdmin();

        $updateData = [
            'companyName' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 (555) 123-4567',
            'navLinks' => [
                [
                    'type' => 'simple',
                    'label' => ['en' => 'Home', 'fr' => 'Accueil', 'ar' => 'الصفحة الرئيسية'],
                    'href' => '/',
                ],
                [
                    'type' => 'dropdown',
                    'label' => ['en' => 'Services', 'fr' => 'Services', 'ar' => 'الخدمات'],
                    'items' => [
                        ['label' => ['en' => 'Tours', 'fr' => 'Circuits', 'ar' => 'الجولات'], 'href' => '/tours'],
                        ['label' => ['en' => 'Hotels', 'fr' => 'Hôtels', 'ar' => 'الفنادق'], 'href' => '/hotels'],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', $updateData);

        $response->assertOk();

        // Refresh cache to get updated data
        Cache::forget('site-settings');
        $setting = SiteSetting::first();
        $this->assertIsArray($setting->content['nav']['simpleLinks']);
        $this->assertEquals('dropdown', $setting->content['nav']['simpleLinks'][1]['type']);
    }

    public function test_authenticated_user_can_update_structured_hours(): void
    {
        $user = $this->createAuthenticatedAdmin();

        $payload = [
            'companyName' => 'BelAzurTravel',
            'email' => 'hello@example.com',
            'phone' => '+1 (555) 123-4567',
            'hours' => [
                [
                    'dayKey' => 'footer.mon',
                    'ranges' => ['09:00 - 18:00'],
                    'closed' => false,
                ],
                [
                    'dayKey' => 'footer.tue',
                    'ranges' => ['09:00 - 18:00'],
                    'closed' => false,
                ],
                [
                    'dayKey' => 'footer.sun',
                    'ranges' => [],
                    'closed' => true,
                ],
            ],
        ];

        $this->actingAs($user)
            ->putJson('/api/site-settings', $payload)
            ->assertOk();

        $this->actingAs($user)
            ->getJson('/api/site-settings')
            ->assertOk()
            ->assertJsonPath('hours.0.dayKey', 'footer.mon')
            ->assertJsonPath('hours.0.ranges.0.value', '09:00 - 18:00')
            ->assertJsonPath('hours.2.closed', true);
    }

    /**
     * Test unauthenticated user cannot update settings
     */
    public function test_unauthenticated_user_cannot_update_site_settings(): void
    {
        $response = $this->putJson('/api/site-settings', [
            'companyName' => 'Hacked Company',
        ]);

        $response->assertUnauthorized();
    }

    /**
     * Test partial updates are allowed
     */
    public function test_partial_update_is_allowed_without_required_profile_fields(): void
    {
        $user = $this->createAuthenticatedAdmin();

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', [
                'email' => 'incomplete@example.com',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('site_settings', [
            'email' => 'incomplete@example.com',
        ]);
    }

    /**
     * Test cache is cleared on update
     */
    public function test_cache_is_cleared_after_update(): void
    {
        $user = $this->createAuthenticatedAdmin();

        // Prime the cache
        $this->getJson('/api/site-settings');

        $updateData = [
            'companyName' => 'Cache Test',
            'email' => 'cache@example.com',
            'phone' => '+1 (555) 111-2222',
        ];

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', $updateData);

        $response->assertOk();

        // Verify cache was cleared by fetching and checking new data
        $response = $this->getJson('/api/site-settings');
        $this->assertEquals('Cache Test', $response->json('companyName'));
    }

    /**
     * Test social links are returned
     */
    public function test_site_settings_includes_social_links(): void
    {
        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $socialLinks = $response->json('socialLinks');
        $this->assertIsArray($socialLinks);
        $this->assertGreaterThan(0, count($socialLinks));
    }

    /**
     * Test footer links are returned
     */
    public function test_site_settings_includes_footer_links(): void
    {
        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $footerLinks = $response->json('footerLinks');
        $this->assertIsArray($footerLinks);
        $this->assertGreaterThan(0, count($footerLinks));
    }

    /**
     * Test hours are returned
     */
    public function test_site_settings_includes_hours(): void
    {
        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $hours = $response->json('hours');
        $this->assertIsArray($hours);
        $this->assertGreaterThan(0, count($hours));
    }

    public function test_site_settings_normalizes_legacy_hours_shape(): void
    {
        SiteSetting::query()->firstOrFail()->update([
            'hours' => [
                [
                    'dayKey' => 'footer.mon',
                    'value' => '09:00 - 18:00',
                ],
                [
                    'dayKey' => 'footer.tue',
                    'value' => '09:00 - 18:00',
                ],
            ],
        ]);

        $response = $this->getJson('/api/site-settings');

        $response->assertOk();
        $response->assertJsonPath('hours.0.dayKey', 'footer.mon');
        $response->assertJsonPath('hours.0.ranges.0.value', '09:00 - 18:00');
        $response->assertJsonPath('hours.1.dayKey', 'footer.tue');
    }

    /**
     * Helper method to create authenticated admin user
     */
    protected function createAuthenticatedAdmin()
    {
        return User::factory()
            ->create(['role' => 'admin']);
    }
}
