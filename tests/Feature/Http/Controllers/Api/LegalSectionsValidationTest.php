<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalSectionsValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create initial site setting
        SiteSetting::create(['company_name' => 'BelAzurTravel']);
    }

    public function test_admin_can_update_legal_sections_with_valid_data(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $legalSections = [
            [
                'title' => ['en' => 'Terms', 'fr' => 'Conditions', 'ar' => 'الشروط'],
                'body' => ['format' => 'text', 'content' => 'Valid body'],
            ],
        ];

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', ['legalSections' => $legalSections]);

        $response->assertOk();
        $this->assertDatabaseHas('site_settings', ['legal_sections' => json_encode($legalSections)]);
    }

    public function test_admin_cannot_update_legal_sections_with_missing_title_keys(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $legalSections = [
            [
                'title' => ['en' => 'Terms'], // missing fr/ar
                'body' => ['format' => 'text', 'content' => 'Invalid body'],
            ],
        ];

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', ['legalSections' => $legalSections]);

        $response->assertStatus(422);
    }

    public function test_admin_cannot_update_legal_sections_with_missing_body(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $legalSections = [
            ['title' => ['en' => 'T', 'fr' => 'T', 'ar' => 'T']], // missing body
        ];

        $response = $this->actingAs($user)
            ->putJson('/api/site-settings', ['legalSections' => $legalSections]);

        $response->assertStatus(422);
    }
}
