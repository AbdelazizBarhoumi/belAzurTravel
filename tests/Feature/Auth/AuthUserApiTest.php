<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthUserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_current_user_endpoint_and_receives_null(): void
    {
        $response = $this->getJson('/api/auth/user');

        $response->assertOk()
            ->assertJsonPath('user', null);
    }

    public function test_authenticated_user_can_view_current_user_endpoint(): void
    {
        $user = User::factory()->create([
            'role' => 'assistant',
            'preferred_language' => 'fr',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/user');

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.name', $user->name)
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.role', $user->role)
            ->assertJsonPath('user.preferred_language', $user->preferred_language);
    }
}
