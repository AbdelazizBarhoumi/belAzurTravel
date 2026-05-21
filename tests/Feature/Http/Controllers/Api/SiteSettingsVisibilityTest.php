<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SiteSettingsVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_client_does_not_receive_disabled_page_content(): void
    {
        $this->disableNavPage('contact');

        $response = $this->actingAs($this->makeActiveUser('client'))
            ->getJson('/api/site-settings');

        $response->assertOk();
        $response->assertJsonMissingPath('content.contact');
    }

    public function test_admin_still_receives_disabled_page_content(): void
    {
        $this->disableNavPage('contact');

        $response = $this->actingAs($this->makeActiveUser('admin'))
            ->getJson('/api/site-settings');

        $response->assertOk();
        $response->assertJsonPath('content.contact.title.en', 'Contact Us');
    }

    protected function disableNavPage(string $pageKey): void
    {
        $setting = SiteSetting::query()->firstOrFail();
        $content = $setting->content ?? [];

        $content['nav']['settings'] = [
            'header' => [
                [
                    'pageKey' => $pageKey,
                    'enabled' => false,
                ],
            ],
            'footer' => [],
        ];

        // Ensure contact is present in content for visibility check
        $content['contact'] = [
            'title' => [
                'en' => 'Contact Us',
                'fr' => 'Contact Us',
                'ar' => 'Contact Us',
            ],
        ];

        $setting->update(['content' => $content]);
        Cache::forget('site-settings');
        Cache::forget('site_settings_nav');
    }

    protected function makeActiveUser(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'active' => true,
        ]);
    }
}