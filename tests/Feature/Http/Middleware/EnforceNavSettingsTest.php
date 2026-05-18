<?php

namespace Tests\Feature\Http\Middleware;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class EnforceNavSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_disabled_contact_page_blocks_public_users(): void
    {
        $this->disableNavPage('contact');

        // Guest (unauthenticated) should be blocked
        $this->get('/contact')->assertNotFound();
        // Client (authenticated but public) should be blocked
        $this->actingAs($this->makeActiveUser('client'))->get('/contact')->assertNotFound();
        // Assistant and admin should have access
        $this->actingAs($this->makeActiveUser('assistant'))->get('/contact')->assertOk();
        $this->actingAs($this->makeActiveUser('admin'))->get('/contact')->assertOk();
    }

    public function test_enabled_contact_page_is_accessible_for_every_role(): void
    {
        $this->enableNavPage('contact');

        foreach ([null, 'client', 'assistant', 'admin'] as $role) {
            $request = $role === null
                ? $this->get('/contact')
                : $this->actingAs($this->makeActiveUser($role))->get('/contact');

            $request->assertOk();
        }
    }

    protected function disableNavPage(string $pageKey): void
    {
        $this->setNavSettings($pageKey, false);
    }

    protected function enableNavPage(string $pageKey): void
    {
        $this->setNavSettings($pageKey, true);
    }

    protected function setNavSettings(string $pageKey, bool $enabled): void
    {
        $setting = SiteSetting::query()->firstOrFail();
        $content = $setting->content ?? [];

        $content['nav']['settings'] = [
            'header' => [
                [
                    'pageKey' => $pageKey,
                    'enabled' => $enabled,
                ],
            ],
            'footer' => [],
        ];

        $setting->update(['content' => $content]);

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