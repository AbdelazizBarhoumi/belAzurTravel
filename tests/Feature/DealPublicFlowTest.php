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
            'details' => ['highlights' => ['Cheap'], 'terms' => ['Apply']]
        ]);

        // Test Index
        $response = $this->getJson('/api/deals');
        $response->assertStatus(200);
        $response->assertJsonFragment(['slug' => 'summer-deal']);

        // Test Show
        $response = $this->getJson('/api/deals/summer-deal');
        $response->assertStatus(200);
        $response->assertJsonPath('slug', 'summer-deal');
        $response->assertJsonPath('category.en', 'Summer');
    }
}
