<?php

namespace Tests\Feature;

use App\Models\Deal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealPublicFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_and_show_deals(): void
    {
        $deal = Deal::create([
            'slug' => 'summer-deal',
            'title' => ['en' => 'Summer Deal', 'fr' => 'Offre Été', 'ar' => 'عرض الصيف'],
            'description' => ['en' => 'Desc', 'fr' => 'Desc', 'ar' => 'وصف'],
            'category' => ['en' => 'Summer', 'fr' => 'Été', 'ar' => 'صيف'],
            'category_key' => 'Summer',
            'details' => [
                'highlights' => [
                    'en' => ['Cheap', 'Flexible'],
                    'fr' => ['Bon marché', 'Flexible'],
                    'ar' => ['رخيص', 'مرن'],
                ],
                'terms' => [
                    'en' => ['Apply'],
                    'fr' => ['Appliquer'],
                    'ar' => ['تطبق'],
                ],
            ],
        ]);

        // Test Index
        $response = $this->getJson('/api/deals');
        $response->assertStatus(200);
        $response->assertJsonFragment(['slug' => 'summer-deal']);
        $response->assertJsonFragment(['category_key' => 'Summer']);

        // Test Show
        $response = $this->getJson('/api/deals/summer-deal');
        $response->assertStatus(200);
        $response->assertJsonPath('slug', 'summer-deal');
        $response->assertJsonPath('category.en', 'Summer');
        $response->assertJsonPath('category_key', 'Summer');
        $response->assertJsonPath('highlights.0.en', 'Cheap');
        $response->assertJsonPath('highlights.1.fr', 'Flexible');
        $response->assertJsonPath('terms.0.ar', 'تطبق');
    }
}
