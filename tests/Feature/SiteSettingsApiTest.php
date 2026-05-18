<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_partially_update_nav_settings_without_required_profile_fields(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        SiteSetting::create([
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@voyageur.com',
            'phone' => '+1 (555) 123-4567',
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
                                'pageKey' => 'promos',
                                'enabled' => true,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'more',
                                'items' => [],
                            ],
                        ],
                        'footer' => [
                            [
                                'title' => 'Quick Links',
                                'pageKeys' => ['destinations', 'promos'],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $payload = [
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
                                'pageKey' => 'promos',
                                'enabled' => false,
                                'isDropdown' => false,
                                'linkSelf' => true,
                                'placement' => 'more',
                                'items' => [],
                            ],
                        ],
                        'footer' => [
                            [
                                'title' => 'Quick Links',
                                'pageKeys' => ['destinations'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->actingAs($admin)
            ->putJson('/api/site-settings', $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $this->actingAs($admin)
            ->getJson('/api/site-settings')
            ->assertOk()
            ->assertJsonPath('content.nav.settings.header.1.pageKey', 'promos')
            ->assertJsonPath('content.nav.settings.header.1.enabled', false)
            ->assertJsonPath('content.nav.settings.footer.0.pageKeys.0', 'destinations');
    }
}
