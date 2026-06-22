<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_update_profile()
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@belazurtravel.com',
            'role' => 'client',
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/client/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@belazurtravel.com',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@belazurtravel.com',
        ]);
    }

    public function test_profile_update_validation()
    {
        $user = User::factory()->create(['role' => 'client']);
        $otherUser = User::factory()->create(['email' => 'taken@belazurtravel.com']);

        // Test empty name
        $response = $this->actingAs($user)
            ->putJson('/api/client/profile', [
                'name' => '',
                'email' => 'new@belazurtravel.com',
            ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        // Test invalid email
        $response = $this->actingAs($user)
            ->putJson('/api/client/profile', [
                'name' => 'New Name',
                'email' => 'not-an-email',
            ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);

        // Test duplicate email
        $response = $this->actingAs($user)
            ->putJson('/api/client/profile', [
                'name' => 'New Name',
                'email' => 'taken@belazurtravel.com',
            ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_client_can_update_language()
    {
        $user = User::factory()->create(['preferred_language' => 'en', 'role' => 'client']);

        $response = $this->actingAs($user)
            ->patchJson('/api/user/language', [
                'language' => 'fr',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('fr', $user->fresh()->preferred_language);
    }
}
