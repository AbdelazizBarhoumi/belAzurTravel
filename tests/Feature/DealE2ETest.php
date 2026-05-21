<?php

namespace Tests\Feature;

use App\Models\Deal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealE2ETest extends TestCase
{
    use RefreshDatabase;

    public function test_deal_flow_creates_and_retrieves_highlights_and_terms(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $payload = [
            'title_en' => 'Test Deal',
            'title_fr' => 'Offre Test',
            'title_ar' => 'صفقة اختبار',
            'highlights' => [['en' => 'Highlight 1'], ['en' => 'Highlight 2']],
            'terms' => [['en' => 'Term 1']],
        ];

        // 1. Create deal
        $response = $this->actingAs($admin)
            ->withoutMiddleware()
            ->postJson('/api/admin/deals', $payload)
            ->assertCreated();

        $dealId = $response->json('data.id');

        // 2. Verify Database
        $deal = Deal::findOrFail($dealId);
        $this->assertEquals('Highlight 1', $deal->details['highlights'][0]['en']);
        $this->assertEquals('Term 1', $deal->details['terms'][0]['en']);

        // 3. Verify API response
        $this->actingAs($admin)
            ->getJson('/api/admin/deals/' . $dealId)
            ->assertOk()
            ->assertJsonPath('data.highlights.0.en', 'Highlight 1')
            ->assertJsonPath('data.terms.0.en', 'Term 1');
    }
}
