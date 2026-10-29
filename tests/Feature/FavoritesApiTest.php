<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoritesApiTest extends TestCase
{
    use RefreshDatabase;

    private function item(array $overrides = []): array
    {
        return array_merge([
            'type' => 'tour',
            'id' => 'sahara',
            'name' => 'Sahara',
            'image' => '/img/sahara.jpg',
            'price' => 450,
            'location' => 'Douz',
        ], $overrides);
    }

    public function test_guests_cannot_use_account_favorites(): void
    {
        $this->getJson('/api/favorites')->assertUnauthorized();
    }

    public function test_client_can_add_list_and_remove_a_favorite(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Tour::factory()->create(['slug' => 'sahara']);

        $this->actingAs($client)->postJson('/api/favorites', $this->item())
            ->assertCreated()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', 'sahara')
            ->assertJsonPath('0.type', 'tour');

        // Adding again does not duplicate.
        $this->actingAs($client)->postJson('/api/favorites', $this->item())->assertCreated()->assertJsonCount(1);

        $this->actingAs($client)->getJson('/api/favorites')->assertOk()->assertJsonCount(1);

        $this->actingAs($client)->deleteJson('/api/favorites/tour/sahara')->assertOk()->assertJsonCount(0);
    }

    public function test_unknown_items_and_types_are_rejected(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)->postJson('/api/favorites', $this->item(['id' => 'does-not-exist']))
            ->assertUnprocessable();
        $this->actingAs($client)->postJson('/api/favorites', $this->item(['type' => 'blog']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type']);
    }

    public function test_favorites_are_private_to_each_user(): void
    {
        $owner = User::factory()->create(['role' => 'client']);
        $other = User::factory()->create(['role' => 'client']);
        Tour::factory()->create(['slug' => 'sahara']);

        $this->actingAs($owner)->postJson('/api/favorites', $this->item())->assertCreated();

        $this->actingAs($other)->getJson('/api/favorites')->assertOk()->assertJsonCount(0);
        $this->actingAs($other)->deleteJson('/api/favorites/tour/sahara')->assertOk();
        $this->actingAs($owner)->getJson('/api/favorites')->assertJsonCount(1);
    }

    public function test_guest_list_is_merged_on_sync_and_stale_items_skipped(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Tour::factory()->create(['slug' => 'sahara']);
        Car::factory()->create(['slug' => 'clio-5']);

        $this->actingAs($client)->postJson('/api/favorites', $this->item())->assertCreated();

        $this->actingAs($client)->postJson('/api/favorites/sync', ['items' => [
            $this->item(),
            $this->item(['type' => 'car', 'id' => 'clio-5', 'name' => 'Clio 5']),
            $this->item(['id' => 'removed-tour', 'name' => 'Gone']),
        ]])
            ->assertOk()
            ->assertJsonCount(2);
    }
}
