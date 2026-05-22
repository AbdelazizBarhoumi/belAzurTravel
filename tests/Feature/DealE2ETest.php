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
            'highlights_en' => ['Highlight 1', 'Highlight 2'],
            'highlights_fr' => ['Point fort 1', 'Point fort 2'],
            'highlights_ar' => ['ميزة 1', 'ميزة 2'],
            'terms_en' => ['Term 1'],
            'terms_fr' => ['Condition 1'],
            'terms_ar' => ['شرط 1'],
        ];

        // 1. Create deal
        $response = $this->actingAs($admin)
            ->withoutMiddleware()
            ->postJson('/api/admin/deals', $payload)
            ->assertCreated();

        $dealId = $response->json('data.id');

        // 2. Verify Database
        $deal = Deal::findOrFail($dealId);
        $this->assertEquals('Highlight 1', $deal->details['highlights']['en'][0]);
        $this->assertEquals('Term 1', $deal->details['terms']['en'][0]);

        // 3. Verify API response
        $this->actingAs($admin)
            ->getJson('/api/admin/deals/'.$dealId)
            ->assertOk()
            ->assertJsonPath('data.highlights_en.0', 'Highlight 1')
            ->assertJsonPath('data.terms_en.0', 'Term 1');
    }
}
