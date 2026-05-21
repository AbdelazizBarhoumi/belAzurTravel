<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryControllerCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_index_returns_cached_results_until_mutation_clears_cache(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        Category::create([
            'entity_type' => 'destinations',
            'key' => 'beach',
            'name' => [
                'en' => 'Beach',
                'fr' => 'Plage',
                'ar' => 'شاطئ',
            ],
        ]);

        $this->getJson('/api/categories?type=destinations')
            ->assertOk()
            ->assertJsonPath('data.0.name.en', 'Beach');

        Category::where('entity_type', 'destinations')
            ->where('key', 'beach')
            ->update([
                'name' => [
                    'en' => 'Updated Beach',
                    'fr' => 'Plage mise à jour',
                    'ar' => 'شاطئ محدث',
                ],
            ]);

        $this->getJson('/api/categories?type=destinations')
            ->assertOk()
            ->assertJsonPath('data.0.name.en', 'Beach');

        $this->actingAs($admin)
            ->postJson('/api/admin/categories', [
                'entity_type' => 'destinations',
                'name' => [
                    'en' => 'Mountain',
                    'fr' => 'Montagne',
                    'ar' => 'جبل',
                ],
            ])
            ->assertCreated();

        $this->getJson('/api/categories?type=destinations')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}