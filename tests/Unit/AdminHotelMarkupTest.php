<?php

namespace Tests\Unit;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminHotelMarkupTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);
    }

    private function hotel(int $price = 100): Hotel
    {
        return Hotel::create([
            'slug' => 'test-hotel',
            'code' => 'test-hotel',
            'name' => ['en' => 'Test Hotel', 'fr' => 'Hôtel Test', 'ar' => 'فندق تجريبي'],
            'location' => ['en' => 'Tunis', 'fr' => 'Tunis', 'ar' => 'تونس'],
            'image' => '/storage/uploads/hotels/test.jpg',
            'price' => $price,
        ]);
    }

    public function test_admin_update_computes_price_from_base_and_markup(): void
    {
        $hotel = $this->hotel();

        $this->actingAs($this->admin())
            ->putJson("/api/admin/hotels/{$hotel->id}", [
                'base_price' => 200,
                'markup_percentage' => 25,
            ])
            ->assertOk()
            ->assertJsonPath('data.base_price', 200)
            ->assertJsonPath('data.markup_percentage', '25.00')
            ->assertJsonPath('data.price', 250);

        $hotel->refresh();
        $this->assertSame(200, $hotel->base_price);
        $this->assertSame(250, $hotel->price);
    }

    public function test_admin_update_with_base_only_uses_default_markup(): void
    {
        $hotel = $this->hotel();

        $this->actingAs($this->admin())
            ->putJson("/api/admin/hotels/{$hotel->id}", [
                'base_price' => 200,
            ])
            ->assertOk()
            ->assertJsonPath('data.price', 240);

        $hotel->refresh();
        $this->assertSame(240, $hotel->price);
    }

    public function test_admin_update_with_legacy_price_only_keeps_as_is(): void
    {
        $hotel = $this->hotel(150);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/hotels/{$hotel->id}", [
                'price' => 175,
            ])
            ->assertOk()
            ->assertJsonPath('data.price', 175);

        $hotel->refresh();
        $this->assertSame(175, $hotel->price);
        $this->assertNull($hotel->base_price);
    }
}
