<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\LegalContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalContentSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_fills_empty_legal_pages_in_french_and_english(): void
    {
        SiteSetting::query()->create(['company_name' => 'BelAzur Travel', 'email' => 'contact@belazurtravel.com']);

        $this->seed(LegalContentSeeder::class);

        $row = SiteSetting::query()->first();
        $this->assertCount(5, $row->legal_sections);
        $this->assertStringContainsString('BelAzur Travel', $row->legal_sections[0]['body']['content']['fr']);
        $this->assertNotSame('', $row->legal_sections[0]['body']['content']['en']);
        $this->assertStringNotContainsString('{company}', json_encode($row->legal_sections));

        foreach (['privacy_policy', 'purchase_policy'] as $key) {
            $this->assertStringContainsString('##', $row->content[$key]['body']['content']['fr']);
            $this->assertStringContainsString('##', $row->content[$key]['body']['content']['en']);
        }
        $this->assertStringContainsString('2004-63', $row->content['privacy_policy']['body']['content']['fr']);
    }

    public function test_it_never_overwrites_admin_content(): void
    {
        SiteSetting::query()->create([
            'company_name' => 'BelAzur Travel',
            'legal_sections' => [['title' => ['fr' => 'Mine'], 'body' => ['format' => 'markdown', 'content' => ['fr' => 'Custom']]]],
            'content' => ['privacy_policy' => ['title' => ['fr' => 'X'], 'body' => ['format' => 'markdown', 'content' => ['fr' => 'Edited']]]],
        ]);

        $this->seed(LegalContentSeeder::class);

        $row = SiteSetting::query()->first();
        $this->assertSame('Custom', $row->legal_sections[0]['body']['content']['fr']);
        $this->assertSame('Edited', $row->content['privacy_policy']['body']['content']['fr']);
        $this->assertNotEmpty($row->content['purchase_policy']['body']['content']['fr']);
    }

    public function test_content_patch_updates_one_policy_without_touching_the_other(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'active' => true]);
        SiteSetting::query()->create([
            'company_name' => 'BelAzur Travel',
            'content' => [
                'privacy_policy' => ['body' => ['content' => ['fr' => 'Privacy v1']]],
                'purchase_policy' => ['body' => ['content' => ['fr' => 'Purchase v1']]],
                'hero' => ['title' => 'keep me'],
            ],
        ]);

        $this->actingAs($admin)->putJson('/api/site-settings', [
            'contentPatch' => ['purchase_policy' => ['body' => ['format' => 'markdown', 'content' => ['fr' => 'Purchase v2']]]],
        ])->assertSuccessful();

        $content = SiteSetting::query()->first()->content;
        $this->assertSame('Purchase v2', $content['purchase_policy']['body']['content']['fr']);
        $this->assertSame('Privacy v1', $content['privacy_policy']['body']['content']['fr']);
        $this->assertSame('keep me', $content['hero']['title']);
    }
}
