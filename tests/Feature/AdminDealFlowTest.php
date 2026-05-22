<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDealFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_deal_with_category_key(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $payload = [
            'title_en' => 'Test Deal',
            'title_fr' => 'Offre Test',
            'title_ar' => 'عرض تجريبي',
            'category_en' => 'Summer',
            'category_fr' => 'Été',
            'category_ar' => 'صيف',
        ];

        // Create
        $response = $this->postJson('/api/admin/deals', $payload);
        $response->assertStatus(201);
        $dealId = $response->json('data.id');

        $this->assertDatabaseHas('deals', [
            'id' => $dealId,
            'category_key' => 'Summer',
        ]);

        // Update
        $updatePayload = [
            'title_en' => 'Updated Deal',
            'title_fr' => 'Offre Mise à Jour',
            'title_ar' => 'عرض محدث',
            'category_en' => 'Winter',
            'category_fr' => 'Hiver',
            'category_ar' => 'شتاء',
        ];

        $response = $this->putJson("/api/admin/deals/{$dealId}", $updatePayload);
        $response->assertStatus(200);
        $response->assertJsonPath('data.category_key', 'Winter');

        $this->assertDatabaseHas('deals', [
            'id' => $dealId,
            'category_key' => 'Winter',
        ]);
    }
}
