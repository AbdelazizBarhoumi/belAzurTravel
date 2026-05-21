<?php

namespace Tests\Feature;

use App\Models\Deal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminDealsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_deals_with_localized_titles_and_cache_invalidation(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'title_en' => 'Portugal Escape',
            'title_fr' => 'Évasion au Portugal',
            'title_ar' => 'هروب البرتغال',
            'description_en' => 'Limited offer',
            'discount_en' => '20% OFF',
            'expires_en' => 'Aug 31, 2026',
            'category_en' => 'Seasonal',
        ];

        $response = $this->actingAs($admin)
            ->withoutMiddleware()
            ->postJson('/api/admin/deals', $payload)
            ->assertCreated()
            ->json('data');

        $this->assertArrayHasKey('id', $response);
        $deal = Deal::query()->findOrFail($response['id']);

        // Titles stored as JSON with locales
        $this->assertEquals('Portugal Escape', $deal->title['en']);
        $this->assertEquals('Évasion au Portugal', $deal->title['fr']);

        // Public index should include the deal (cache invalidated on create)
        $public = $this->getJson('/api/deals')->assertOk()->json();
        $this->assertTrue(collect($public)->contains(fn($d) => ($d['slug'] ?? '') === $deal->slug));

        // Update title
        $this->actingAs($admin)
            ->putJson('/api/admin/deals/'.$deal->id, [
                'title_en' => 'Portugal Escape Updated',
                'title_fr' => 'Évasion mise à jour',
                'title_ar' => 'تحديث البرتغال',
            ])
            ->assertOk();

        $updated = Deal::query()->findOrFail($deal->id);
        $this->assertEquals('Portugal Escape Updated', $updated->title['en']);

        // Public show should reflect updated title (cache invalidated on update)
        $publicShow = $this->getJson('/api/deals/'.$updated->slug)->assertOk()->json();
        $this->assertEquals('Portugal Escape Updated', $publicShow['title']['en']);

        // Delete
        $this->actingAs($admin)
            ->deleteJson('/api/admin/deals/'.$updated->id)
            ->assertOk();

        $this->assertDatabaseMissing('deals', ['id' => $updated->id]);
    }

    public function test_deals_ignore_image_field_and_do_not_store_it(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'title_en' => 'No Image Deal',
            'title_fr' => 'Offre sans image',
            'title_ar' => 'عرض بدون صورة',
            'image' => '/images/should-not-be-saved.jpg',
        ];

        $response = $this->actingAs($admin)
            ->withoutMiddleware()
            ->postJson('/api/admin/deals', $payload)
            ->assertCreated()
            ->json('data');

        $deal = Deal::query()->findOrFail($response['id']);

        $this->assertArrayNotHasKey('image', $deal->getAttributes());
    }
}
