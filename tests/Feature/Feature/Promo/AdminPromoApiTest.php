<?php

namespace Tests\Feature\Feature\Promo;

use App\Models\Promo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPromoApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_list_promos(): void
    {
        Promo::factory()->create();
        $this->actingAs($this->admin)
            ->getJson('/api/admin/promos')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'code', 'title_en']]]);
    }

    public function test_admin_can_create_promo(): void
    {
        $payload = [
            'code' => 'NEWPROMO',
            'title_en' => 'Title', 'title_fr' => 'Titre', 'title_ar' => 'عنوان',
            'discount_en' => '10%', 'discount_fr' => '10%', 'discount_ar' => '10%',
            'description_en' => 'Desc', 'description_fr' => 'Desc', 'description_ar' => 'Desc',
            'expires_en' => '2026', 'expires_fr' => '2026', 'expires_ar' => '2026',
            'eligibility_en' => 'All', 'eligibility_fr' => 'Tous', 'eligibility_ar' => 'الكل',
            'howToUse_en' => 'Use', 'howToUse_fr' => 'Utiliser', 'howToUse_ar' => 'استخدم',
            'terms_en' => 'None', 'terms_fr' => 'Aucun', 'terms_ar' => 'لا يوجد',
        ];

        $this->actingAs($this->admin)
            ->postJson('/api/admin/promos', $payload)
            ->assertCreated()
            ->assertJsonFragment(['code' => 'NEWPROMO']);
    }
}
