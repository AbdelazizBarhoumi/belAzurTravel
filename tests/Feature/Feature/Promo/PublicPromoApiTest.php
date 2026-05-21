<?php

namespace Tests\Feature\Feature\Promo;

use App\Models\Promo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPromoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_promos(): void
    {
        Promo::factory()->create(['code' => 'SPRING30']);
        $this->getJson('/api/promos')
            ->assertOk()
            ->assertJsonFragment(['code' => 'SPRING30']);
    }

    public function test_public_can_view_promo(): void
    {
        $promo = Promo::factory()->create(['code' => 'SPRING30']);
        $this->getJson('/api/promos/SPRING30')
            ->assertOk()
            ->assertJsonFragment(['code' => 'SPRING30']);
    }
}
